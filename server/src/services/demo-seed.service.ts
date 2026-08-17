import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { promises as fs } from "fs";
import { join } from "path";
import { In, Repository } from "typeorm";
import { Wallpaper } from "../entities/wallpaper.entity";
import { Tag } from "../entities/tag.entity";
import { User, UserRole } from "../entities/user.entity";
import { UploadService } from "./upload.service";

/**
 * 演示数据初始化：读取本地 uploads/壁纸 目录的源图，
 * 走 UploadService（COS 上传 + 内容审核）入库，审核不通过的图自动跳过。
 * 统计字段（浏览/点赞/收藏）保持 0，由真实用户行为产生。
 */
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  /** 分类轮转顺序（与 wallhaven 一致的 general / anime / people） */
  private readonly categories: Array<Wallpaper["category"]> = [
    "general",
    "anime",
    "people",
  ];

  /**
   * 按分类的种子标签（取自 wallhaven.cc 热门通用标签，共 20 个）。
   * 壁纸只会挂所属分类下的标签，保证内容与标签相符。
   */
  private readonly categoryTags: Record<Wallpaper["category"], string[]> = {
    general: [
      "nature",
      "landscape",
      "sky",
      "clouds",
      "water",
      "sunlight",
      "outdoors",
      "simple background",
      "minimalism",
      "space",
    ],
    anime: ["anime", "anime girls", "digital art", "fan art", "video games"],
    people: ["women", "long hair", "blue eyes", "smiling", "closeup"],
  };

  /** 每张壁纸挂的标签数 */
  private readonly tagsPerWallpaper = 3;

  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly uploadService: UploadService,
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

    // 接受 ADMIN 或 SUPER_ADMIN 作为上传者（种子管理员现为 SUPER_ADMIN）
    const uploader = await this.userRepository.findOne({
      where: { role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]) },
      order: { createdAt: "ASC" },
    });
    if (!uploader) {
      this.logger.warn("未找到管理员账号，无法初始化演示壁纸。");
      return;
    }

    const wallpapersDir = join(process.cwd(), "uploads", "壁纸");
    const files = await this.loadWallpaperFiles(wallpapersDir);
    if (files.length === 0) {
      this.logger.warn("uploads/壁纸 目录为空，跳过演示壁纸初始化。");
      return;
    }

    const limit = this.getSeedLimit(files.length);
    const selectedFiles = files.slice(0, limit);

    // 预创建全部种子标签（未用到的 usageCount 保持 0）
    const tagsByName = new Map<string, Tag>();
    for (const name of new Set(Object.values(this.categoryTags).flat())) {
      tagsByName.set(name, await this.ensureTag(name));
    }

    const tagUsage = new Map<number, number>();
    const entities: Wallpaper[] = [];

    for (const [index, fileName] of selectedFiles.entries()) {
      try {
        const buffer = await fs.readFile(join(wallpapersDir, fileName));
        const file = {
          buffer,
          mimetype: `image/${this.getImageExtension(fileName)}`,
          size: buffer.length,
        } as Express.Multer.File;
        // COS 上传 + 内容审核（违规或失败抛错，跳过该文件）
        const fileInfo = await this.uploadService.processWallpaperUpload(
          file,
          uploader.id,
        );

        const category = this.categories[index % this.categories.length];
        const relatedTags = this.pickTags(category, index, tagsByName);
        relatedTags.forEach((tag) => {
          tagUsage.set(tag.id, (tagUsage.get(tag.id) || 0) + 1);
        });

        entities.push(
          this.wallpaperRepository.create({
            ...fileInfo,
            category,
            uploaderId: uploader.id,
            status: 1,
            isFeatured: index < 3,
            tags: relatedTags,
          }),
        );
      } catch (error) {
        this.logger.warn(
          `演示壁纸处理失败，跳过: ${fileName} - ${String(error)}`,
        );
      }
    }

    if (entities.length === 0) {
      this.logger.warn("没有可用的演示壁纸实体，跳过初始化。");
      return;
    }

    await this.wallpaperRepository.save(entities);

    // usageCount 写真实关联数
    for (const tag of tagsByName.values()) {
      tag.usageCount = tagUsage.get(tag.id) || 0;
    }
    await this.tagRepository.save([...tagsByName.values()]);

    this.logger.log(`已初始化 ${entities.length} 条演示壁纸数据。`);
  }

  /** 从分类标签列表中按序轮转取 N 个（不同壁纸错开，避免全站同标签） */
  private pickTags(
    category: Wallpaper["category"],
    index: number,
    tagsByName: Map<string, Tag>,
  ): Tag[] {
    const pool = this.categoryTags[category];
    return Array.from({ length: this.tagsPerWallpaper }, (_, offset) => {
      const name = pool[(index + offset) % pool.length];
      return tagsByName.get(name)!;
    });
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

  /** 从文件名推断图片类型（jpeg/png/webp），用于 mimetype */
  private getImageExtension(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "jpeg" || ext === "jpg") return "jpeg";
    if (ext === "png" || ext === "webp") return ext;
    return "jpeg";
  }

  private getSeedLimit(maxAvailable: number): number {
    const rawLimit = Number(process.env.DEMO_SEED_LIMIT || 8);
    if (!Number.isInteger(rawLimit) || rawLimit <= 0) {
      return Math.min(8, maxAvailable);
    }
    return Math.min(rawLimit, maxAvailable);
  }

  private async loadWallpaperFiles(wallpapersDir: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(wallpapersDir);
      return entries
        .filter((fileName) => /\.(jpe?g|png|webp)$/i.test(fileName))
        .sort((left, right) => left.localeCompare(right));
    } catch (error) {
      this.logger.warn(`读取演示壁纸目录失败: ${String(error)}`);
      return [];
    }
  }
}
