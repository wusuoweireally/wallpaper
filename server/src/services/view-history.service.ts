import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ViewHistory } from "../entities/view-history.entity";
import { sanitizeUser } from "../utils/sanitize";
import { normalizePagination } from "../common/pagination";

@Injectable()
export class ViewHistoryService {
  constructor(
    @InjectRepository(ViewHistory)
    private readonly viewHistoryRepository: Repository<ViewHistory>,
  ) {}

  /**
   * 记录浏览并原子计数（浏览量防刷）
   * - 首次浏览：INSERT 成功 → 计数
   * - 1 小时内重复浏览：带窗口条件的 UPDATE 影响 0 行 → 不计数
   * - 超 1 小时：UPDATE 影响 1 行 → 计数
   * INSERT 唯一键冲突会阻塞到另一事务提交，并发重复请求只有一个能计数。
   */
  async recordView(userId: number, wallpaperId: number): Promise<void> {
    const qr =
      this.viewHistoryRepository.manager.connection.createQueryRunner();
    try {
      await qr.connect();
      try {
        await qr.query(
          "INSERT INTO view_history (user_id, wallpaper_id, viewed_at) VALUES (?, ?, NOW())",
          [userId, wallpaperId],
        );
        await this.countView(qr, wallpaperId); // 首次浏览
      } catch (err) {
        if ((err as { code?: string }).code !== "ER_DUP_ENTRY") throw err;
        const res = await qr.query(
          "UPDATE view_history SET viewed_at = NOW() WHERE user_id = ? AND wallpaper_id = ? AND viewed_at < NOW() - INTERVAL 1 HOUR",
          [userId, wallpaperId],
        );
        const affected =
          (res as { affectedRows?: number } | undefined)?.affectedRows ?? 0;
        if (affected > 0) {
          await this.countView(qr, wallpaperId); // 超窗：重新计数
        }
      }
    } finally {
      await qr.release();
    }
  }

  private async countView(
    qr: import("typeorm").QueryRunner,
    wallpaperId: number,
  ): Promise<void> {
    await qr.query(
      "UPDATE wallpapers SET view_count = view_count + 1 WHERE id = ?",
      [wallpaperId],
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
   * 清理30天前的浏览记录
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldViewHistory(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.viewHistoryRepository.delete({
      viewedAt: LessThan(thirtyDaysAgo),
    });
  }
}
