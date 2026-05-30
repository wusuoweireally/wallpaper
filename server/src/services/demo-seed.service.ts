import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { promises as fs } from "fs";
import { join } from "path";
import sharp from "sharp";
import { In, Repository } from "typeorm";
import { Wallpaper } from "../entities/wallpaper.entity";
import { Tag } from "../entities/tag.entity";
import { User, UserRole } from "../entities/user.entity";

type DemoTagTemplate = {
  name: string;
  slug: string;
};

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
    const thumbnailsDir = join(process.cwd(), "uploads", "thumbnails");
    const targetWallpapersDir = join(process.cwd(), "uploads", "wallpapers");
    await fs.mkdir(thumbnailsDir, { recursive: true });
    await fs.mkdir(targetWallpapersDir, { recursive: true });

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
      const filePath = join(wallpapersDir, fileName);
      const stats = await fs.stat(filePath);
      const metadata = await sharp(filePath).metadata();

      if (!metadata.width || !metadata.height) {
        this.logger.warn(`跳过无法识别尺寸的图片: ${fileName}`);
        continue;
      }

      // 生成唯一的文件名（时间戳+索引）
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const newFileName = `demo_${timestamp}_${index}.jpg`;
      const thumbnailName = `demo_${timestamp}_${index}_thumbnail.webp`;

      // 复制原图到 wallpapers 目录
      const newFilePath = join(wallpapersDir, "..", "wallpapers", newFileName);
      await fs.copyFile(filePath, newFilePath);

      // 生成缩略图
      await sharp(filePath)
        .resize(300, null, { fit: "inside" })
        .webp({ quality: 100 })
        .toFile(join(thumbnailsDir, thumbnailName));

      const relatedTags = [
        tags[index % tags.length],
        tags[(index + 1) % tags.length],
      ];
      relatedTags.forEach((tag) => {
        tagUsage.set(tag.id, (tagUsage.get(tag.id) || 0) + 1);
      });

      const wallpaper = this.wallpaperRepository.create({
        fileUrl: `/uploads/wallpapers/${newFileName}`,
        thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
        category: this.categories[index % this.categories.length],
        fileSize: Number(stats.size),
        format: metadata.format || "jpeg",
        width: metadata.width,
        height: metadata.height,
        aspectRatio: Number((metadata.width / metadata.height).toFixed(2)),
        uploaderId: uploader.id,
        viewCount: 120 - index * 7,
        likeCount: 48 - index * 3,
        favoriteCount: 24 - index * 2,
        status: 1,
        isFeatured: index < 3,
        tags: relatedTags,
      });

      entities.push(wallpaper);
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
