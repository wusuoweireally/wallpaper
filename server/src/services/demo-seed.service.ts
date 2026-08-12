import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { promises as fs } from "fs";
import { join } from "path";
import { In, Repository } from "typeorm";
import { Wallpaper } from "../entities/wallpaper.entity";
import { Tag } from "../entities/tag.entity";
import { User, UserRole } from "../entities/user.entity";
import { UploadService } from "./upload.service";

type DemoTagTemplate = {
  name: string;
  slug: string;
};

/**
 * 演示数据初始化：读取本地 uploads/壁纸 目录的源图，
 * 走 UploadService（COS 上传 + 内容审核）入库，审核不通过的图自动跳过
 */
@Injectable()
export class DemoSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoSeedService.name);

  private readonly categories: Array<Wallpaper["category"]> = [
    "general",
    "anime",
    "people",
  ];

  private readonly tagTemplates: DemoTagTemplate[] = [
    { name: "演示", slug: "演示" },
    { name: "精选", slug: "精选" },
    { name: "高清", slug: "高清" },
    { name: "答辩展示", slug: "答辩展示" },
  ];

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
    const tags = await this.ensureTags();
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

        const relatedTags = [
          tags[index % tags.length],
          tags[(index + 1) % tags.length],
        ];
        relatedTags.forEach((tag) => {
          tagUsage.set(tag.id, (tagUsage.get(tag.id) || 0) + 1);
        });

        entities.push(
          this.wallpaperRepository.create({
            ...fileInfo,
            category: this.categories[index % this.categories.length],
            uploaderId: uploader.id,
            viewCount: 120 - index * 7,
            likeCount: 48 - index * 3,
            favoriteCount: 24 - index * 2,
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

    for (const tag of tags) {
      tag.usageCount = tagUsage.get(tag.id) || 0;
    }
    await this.tagRepository.save(tags);

    this.logger.log(`已初始化 ${entities.length} 条演示壁纸数据。`);
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

  private async ensureTags(): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const template of this.tagTemplates) {
      let tag = await this.tagRepository.findOne({
        where: [{ slug: template.slug }, { name: template.name }],
      });

      if (!tag) {
        tag = this.tagRepository.create({
          name: template.name,
          slug: template.slug,
          usageCount: 0,
        });
        await this.tagRepository.save(tag);
      }

      tags.push(tag);
    }

    return tags;
  }
}
