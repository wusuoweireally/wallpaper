import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { readFile } from "fs/promises";
import { join } from "path";
import { In, Repository } from "typeorm";
import { Wallpaper } from "../entities/wallpaper.entity";
import { Tag } from "../entities/tag.entity";
import { User, UserRole } from "../entities/user.entity";

interface DemoWallpaperRow {
  fileUrl: string;
  thumbnailUrl: string | null;
  previewUrl: string | null;
  fileSize: number;
  format: string | null;
  contentHash: string | null;
  width: number;
  height: number;
  aspectRatio: number | null;
  category: Wallpaper["category"];
  subCategory: string | null;
  status: number;
  isFeatured: boolean;
  dominantColor: string | null;
  colorBucket: string | null;
  tags: string[];
}

/**
 * 演示数据：写入开发环境已上传到 COS 的壁纸记录（URL 直连同一桶）。
 * 不重新上传、不走内容审核。库里已有壁纸则跳过。
 */
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.ENABLE_DEMO_SEED !== "true") {
      return;
    }

    const existingWallpapers = await this.wallpaperRepository.count();
    if (existingWallpapers > 0) {
      this.logger.log("检测到已有壁纸数据，跳过演示数据初始化。");
      return;
    }

    const uploader = await this.userRepository.findOne({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
      order: { createdAt: "ASC" },
    });
    if (!uploader) {
      this.logger.warn("未找到管理员账号，无法初始化演示壁纸。");
      return;
    }

    const rows = await this.loadFixture();
    if (!rows.length) {
      this.logger.warn("演示壁纸 fixture 为空，跳过初始化。");
      return;
    }

    const selected = rows.slice(0, this.getSeedLimit(rows.length));
    const tagsByName = new Map<string, Tag>();
    for (const name of new Set(selected.flatMap((row) => row.tags))) {
      tagsByName.set(name, await this.ensureTag(name));
    }

    const tagUsage = new Map<number, number>();
    const entities = selected.map((row) => {
      const tags = row.tags
        .map((name) => tagsByName.get(name))
        .filter((tag): tag is Tag => Boolean(tag));
      for (const tag of tags) {
        tagUsage.set(tag.id, (tagUsage.get(tag.id) || 0) + 1);
      }
      return this.wallpaperRepository.create({
        fileUrl: row.fileUrl,
        thumbnailUrl: row.thumbnailUrl ?? undefined,
        previewUrl: row.previewUrl ?? undefined,
        fileSize: row.fileSize,
        format: row.format ?? undefined,
        contentHash: row.contentHash,
        width: row.width,
        height: row.height,
        aspectRatio: row.aspectRatio ?? undefined,
        category: row.category,
        subCategory: row.subCategory ?? undefined,
        status: row.status,
        isFeatured: row.isFeatured,
        dominantColor: row.dominantColor,
        colorBucket: row.colorBucket,
        uploaderId: uploader.id,
        tags,
      });
    });

    await this.wallpaperRepository.save(entities);

    for (const tag of tagsByName.values()) {
      tag.usageCount = tagUsage.get(tag.id) || 0;
    }
    await this.tagRepository.save([...tagsByName.values()]);

    this.logger.log(
      `已初始化 ${entities.length} 条演示壁纸数据（COS 直链，未重新上传）。`,
    );
  }

  private async loadFixture(): Promise<DemoWallpaperRow[]> {
    const filePath = join(__dirname, "..", "data", "demo-wallpapers.json");
    try {
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as { wallpapers?: DemoWallpaperRow[] };
      return Array.isArray(parsed.wallpapers) ? parsed.wallpapers : [];
    } catch (error) {
      this.logger.warn(`读取演示壁纸 fixture 失败: ${String(error)}`);
      return [];
    }
  }

  /** 按名称找标签，不存在则创建（slug 规则与 TagService.generateSlug 一致） */
  private async ensureTag(name: string): Promise<Tag> {
    const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
    const existing = await this.tagRepository.findOne({
      where: [{ slug }, { name }],
    });
    if (existing) return existing;

    const tag = this.tagRepository.create({ name, slug, usageCount: 0 });
    return this.tagRepository.save(tag);
  }

  /** DEMO_SEED_LIMIT≤0 或未配置：fixture 有多少入多少 */
  private getSeedLimit(maxAvailable: number): number {
    const raw = process.env.DEMO_SEED_LIMIT;
    if (raw === undefined || raw === "") return maxAvailable;
    const rawLimit = Number(raw);
    if (!Number.isInteger(rawLimit) || rawLimit <= 0) return maxAvailable;
    return Math.min(rawLimit, maxAvailable);
  }
}
