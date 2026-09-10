import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ViewHistory } from "../entities/view-history.entity";
import { PostViewHistory } from "../entities/post-view-history.entity";
import { sanitizeUser } from "../utils/sanitize";
import { normalizePagination } from "../common/pagination";

/**
 * 浏览量去重目标：历史表/外键列/计数表各不同，去重流程完全一致。
 * SQL 一律用模板拼这几个白名单常量（非用户输入），不引入注入面。
 */
interface ViewDedupTarget {
  historyTable: "view_history" | "post_view_history";
  idColumn: "wallpaper_id" | "post_id";
  countTable: "wallpapers" | "posts";
}

const WALLPAPER_VIEW: ViewDedupTarget = {
  historyTable: "view_history",
  idColumn: "wallpaper_id",
  countTable: "wallpapers",
};

const POST_VIEW: ViewDedupTarget = {
  historyTable: "post_view_history",
  idColumn: "post_id",
  countTable: "posts",
};

/** 游客浏览去重键的类型前缀：壁纸与帖子 id 会撞号，不加前缀会跨类型误去重 */
type ViewKind = "wallpaper" | "post";

@Injectable()
export class ViewHistoryService {
  /** 游客浏览去重窗口：与登录用户 view_history 的 1 小时窗对齐 */
  private static readonly GUEST_VIEW_TTL_MS = 60 * 60 * 1000;
  /** 内存去重表上限，防止恶意 IP 无限撑大 */
  private static readonly GUEST_VIEW_MAX_ENTRIES = 100_000;

  private readonly guestViewAt = new Map<string, number>();

  constructor(
    @InjectRepository(ViewHistory)
    private readonly viewHistoryRepository: Repository<ViewHistory>,
    @InjectRepository(PostViewHistory)
    private readonly postViewHistoryRepository: Repository<PostViewHistory>,
  ) {}

  /**
   * 游客浏览计数判定（内存版，重启清零可接受）：
   * 同 IP+目标在窗口内只返回 true 一次，调用方据此决定是否累加 viewCount。
   * 服务端权威判定，不依赖前端上报的 trackView 标记。
   * 调用方应传入 getClientIp(request)（优先 CF-Connecting-IP），不要用未规范化的 req.ip。
   */
  recordGuestView(ip: string, targetId: number, kind: ViewKind): boolean {
    const now = Date.now();
    if (this.guestViewAt.size > ViewHistoryService.GUEST_VIEW_MAX_ENTRIES) {
      for (const [key, at] of this.guestViewAt) {
        if (now - at >= ViewHistoryService.GUEST_VIEW_TTL_MS) {
          this.guestViewAt.delete(key);
        }
      }
      // 清完仍超限（同窗高频刷）：整体重置，代价只是部分重复计数
      if (this.guestViewAt.size > ViewHistoryService.GUEST_VIEW_MAX_ENTRIES) {
        this.guestViewAt.clear();
      }
    }

    const key = `${kind}:${ip}:${targetId}`;
    const last = this.guestViewAt.get(key);
    if (
      last !== undefined &&
      now - last < ViewHistoryService.GUEST_VIEW_TTL_MS
    ) {
      return false;
    }
    this.guestViewAt.set(key, now);
    return true;
  }

  /**
   * 记录浏览并原子计数（浏览量防刷）
   * - 首次浏览：INSERT 成功 → 计数
   * - 1 小时内重复浏览：带窗口条件的 UPDATE 影响 0 行 → 不计数
   * - 超 1 小时：UPDATE 影响 1 行 → 计数
   * INSERT 唯一键冲突会阻塞到另一事务提交，并发重复请求只有一个能计数。
   * @returns 本次是否真正累加了计数列
   */
  async recordView(userId: number, wallpaperId: number): Promise<boolean> {
    return this.recordDedupedView(WALLPAPER_VIEW, userId, wallpaperId);
  }

  /** 帖子浏览计数（与壁纸同一套窗口去重，口径一致） */
  async recordPostView(userId: number, postId: number): Promise<boolean> {
    return this.recordDedupedView(POST_VIEW, userId, postId);
  }

  private async recordDedupedView(
    target: ViewDedupTarget,
    userId: number,
    targetId: number,
  ): Promise<boolean> {
    const qr =
      this.viewHistoryRepository.manager.connection.createQueryRunner();
    try {
      await qr.connect();
      try {
        await qr.query(
          `INSERT INTO ${target.historyTable} (user_id, ${target.idColumn}, viewed_at) VALUES (?, ?, NOW())`,
          [userId, targetId],
        );
        await this.countView(qr, target, targetId); // 首次浏览
        return true;
      } catch (err) {
        if ((err as { code?: string }).code !== "ER_DUP_ENTRY") throw err;
        const res: unknown = await qr.query(
          `UPDATE ${target.historyTable} SET viewed_at = NOW() WHERE user_id = ? AND ${target.idColumn} = ? AND viewed_at < NOW() - INTERVAL 1 HOUR`,
          [userId, targetId],
        );
        const affected = mysqlAffectedRows(res);
        if (affected > 0) {
          await this.countView(qr, target, targetId); // 超窗：重新计数
          return true;
        }
        return false;
      }
    } finally {
      await qr.release();
    }
  }

  private async countView(
    qr: import("typeorm").QueryRunner,
    target: ViewDedupTarget,
    targetId: number,
  ): Promise<void> {
    await qr.query(
      // updated_at 赋自身值抑制列上 ON UPDATE CURRENT_TIMESTAMP：
      // 原生 SQL 拦不住 DB 级自动更新，不显式赋值每次浏览仍会刷 updated_at
      `UPDATE ${target.countTable} SET view_count = view_count + 1, updated_at = updated_at WHERE id = ?`,
      [targetId],
    );
  }

  /**
   * 获取用户最近30天的浏览记录（支持分页）
   */
  async getUserViewHistory(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ViewHistory[]; total: number }> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const [data, total] = await this.viewHistoryRepository.findAndCount({
      where: {
        userId,
        wallpaper: { status: 1 },
      },
      relations: ["wallpaper", "wallpaper.uploader"],
      order: { viewedAt: "DESC" },
      skip,
      take: limit,
    });

    return {
      data: data.map((history) => {
        if (!history.wallpaper?.uploader) return history;

        return {
          ...history,
          wallpaper: {
            ...history.wallpaper,
            uploader: sanitizeUser(
              history.wallpaper.uploader as unknown as Record<string, unknown>,
            ) as unknown as typeof history.wallpaper.uploader,
          },
        };
      }),
      total,
    };
  }

  /**
   * 清理30天前的浏览记录（壁纸与帖子两张表同步清理）
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldViewHistory(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.viewHistoryRepository.delete({
      viewedAt: LessThan(thirtyDaysAgo),
    });
    await this.postViewHistoryRepository.delete({
      viewedAt: LessThan(thirtyDaysAgo),
    });
  }
}

function mysqlAffectedRows(res: unknown): number {
  if (Array.isArray(res)) {
    return mysqlAffectedRows(res[0]);
  }
  if (res && typeof res === "object" && "affectedRows" in res) {
    const n = Number((res as { affectedRows?: unknown }).affectedRows);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
