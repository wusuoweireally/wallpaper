import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import { Wallpaper } from "../entities/wallpaper.entity";
import { samplePaletteFromImage } from "./color-palette";
import { hexToColorBucket } from "./wallpaper-filters";

/** 启动后延迟开跑，避开应用启动/迁移窗口 */
const START_DELAY_MS = 15_000;
/** 每批扫描行数与回源并发，压低对 COS 与 DB 的瞬时压力 */
const BATCH_SIZE = 50;
const CONCURRENCY = 3;

/**
 * 存量壁纸色板回填：启动后一次性后台任务，处理 palette 为空的旧行。
 * 回填移出详情请求路径（旧实现内联在 GET /wallpapers/:id，最坏阻塞 8 秒且无并发防护）。
 *
 * 用 id 游标升序推进：失败行（死链/无 http 地址）靠游标天然越过，
 * 不会像"头部窗口 + 失败过滤"那样被聚集的失败行封住导致尾部饿死；
 * 单轮遍历完整张表即退出，进程重启自然重试一轮。
 */
@Injectable()
export class PaletteBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PaletteBackfillService.name);

  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
  ) {}

  onApplicationBootstrap() {
    const timer = setTimeout(() => {
      this.backfill().catch((err) =>
        this.logger.warn(`色板回填任务异常终止: ${String(err)}`),
      );
    }, START_DELAY_MS);
    timer.unref();
  }

  private async backfill(): Promise<void> {
    let backfilled = 0;
    let skipped = 0;
    let cursor = 0;

    for (;;) {
      const rows = await this.wallpaperRepository.find({
        where: { palette: IsNull(), id: MoreThan(cursor) },
        order: { id: "ASC" },
        select: ["id", "thumbnailUrl", "previewUrl"],
        take: BATCH_SIZE,
      });
      if (rows.length === 0) break;
      cursor = Number(rows[rows.length - 1].id);

      const queue = [...rows];
      await Promise.all(
        Array.from(
          { length: Math.min(CONCURRENCY, queue.length) },
          async () => {
            for (;;) {
              const row = queue.shift();
              if (!row) return;
              if (await this.backfillOne(row)) backfilled++;
              else skipped++;
            }
          },
        ),
      );
    }

    if (backfilled > 0 || skipped > 0) {
      this.logger.log(
        `色板回填完成：成功 ${backfilled} 条，跳过 ${skipped} 条。`,
      );
    }
  }

  /** 成功写库返回 true；无可回源地址或拉取/解码失败由游标越过 */
  private async backfillOne(row: Wallpaper): Promise<boolean> {
    const url = [row.thumbnailUrl, row.previewUrl].find((u) =>
      u?.startsWith("http"),
    );
    if (!url) return false;

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const palette = await samplePaletteFromImage(
        Buffer.from(await res.arrayBuffer()),
      );
      // 主色/色桶与色板同源重写：消除旧行"palette 新口径 vs dominantColor 旧口径"并存
      await this.wallpaperRepository.update(row.id, {
        palette,
        dominantColor: palette[0],
        colorBucket: hexToColorBucket(palette[0]) ?? "gray",
      });
      return true;
    } catch {
      return false;
    }
  }
}
