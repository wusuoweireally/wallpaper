import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import sharp from "sharp";
import { createHash, randomBytes } from "crypto";
import { CosService, type AuditResult } from "./cos.service";
import { rgbToColorBucket, rgbToHex } from "./wallpaper-filters";
import { Wallpaper } from "../entities/wallpaper.entity";
import {
  resolutionRequirementMessage,
  resolutionTooSmall,
  WALLPAPER_ALLOWED_MIME,
  WALLPAPER_MAX_BYTES,
} from "./wallpaper-upload.constants";

/** 格式 → 扩展名 */
const EXTENSIONS = { jpeg: "jpg", png: "png", webp: "webp" } as const;

/** 上传处理后的文件信息（入库用） */
export interface UploadedFileInfo {
  fileUrl: string;
  thumbnailUrl: string;
  previewUrl: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  aspectRatio: number;
  dominantColor: string;
  colorBucket: string;
  contentHash: string;
}

/**
 * 图片上传处理：上传 COS 后同步调用腾讯云审核
 * - 违规：删除对象，返回 400"图片不符合上传规范"（避免先成功后裂图）
 * - 通过：公开对象，返回完整 URL
 * 失败路径保证已上传的对象被清理（不留孤儿对象）
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly cos: CosService,
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
  ) {}

  /**
   * 处理壁纸文件上传
   */
  async processWallpaperUpload(
    file: Express.Multer.File,
    uploaderId: number,
  ): Promise<UploadedFileInfo> {
    const info = await this.inspectImage(file.buffer, file.size, file.mimetype);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const nonce = randomBytes(6).toString("hex");
    const fileKey = `wallpapers/${timestamp}_${nonce}__${uploaderId}.${EXTENSIONS[info.format]}`;
    const thumbKey = `thumbnails/${timestamp}_${nonce}__${uploaderId}_thumbnail.webp`;
    const previewKey = `previews/${timestamp}_${nonce}__${uploaderId}_preview.webp`;

    // 1. 上传原图到私有桶（attachment 头：前端直链下载触发浏览器下载而非导航）
    try {
      await this.cos.putObject(
        fileKey,
        file.buffer,
        info.mimeType,
        `attachment; filename="wallpaper-${EXTENSIONS[info.format]}"`,
      );
    } catch (err) {
      this.logger.error("原图上传 COS 失败", (err as Error).message);
      throw new InternalServerErrorException("文件上传失败，请稍后重试");
    }

    // 2. 同步审核原图；违规/异常都先删除对象再抛错
    let audit: AuditResult;
    try {
      audit = await this.cos.auditImage(fileKey, file.size);
    } catch (err) {
      await this.cos.deleteObject(fileKey);
      this.logger.error("审核服务调用失败", (err as Error).message);
      throw new InternalServerErrorException(
        "图片审核服务暂时不可用，请稍后重试",
      );
    }
    if (!audit.passed) {
      await this.cos.deleteObject(fileKey);
      throw new BadRequestException(
        `图片不符合上传规范（${audit.label}），已拒绝上传`,
      );
    }

    // 3. 审核通过：原图公开 + 缩略图/预览图上传并公开
    try {
      await this.cos.setPublicRead(fileKey);
      await this.cos.putObject(thumbKey, info.thumbnailBuffer, "image/webp");
      await this.cos.setPublicRead(thumbKey);
      await this.cos.putObject(previewKey, info.previewBuffer, "image/webp");
      await this.cos.setPublicRead(previewKey);
    } catch (err) {
      this.logger.error("文件发布失败", (err as Error).message);
      await this.cos.deleteObject(fileKey);
      await this.cos.deleteObject(thumbKey);
      await this.cos.deleteObject(previewKey);
      throw new InternalServerErrorException("文件发布失败，请稍后重试");
    }

    return {
      fileUrl: this.cos.publicUrl(fileKey),
      thumbnailUrl: this.cos.publicUrl(thumbKey),
      previewUrl: this.cos.publicUrl(previewKey),
      fileSize: file.size,
      width: info.width,
      height: info.height,
      format: info.format,
      aspectRatio: info.aspectRatio,
      dominantColor: info.dominantColor,
      colorBucket: info.colorBucket,
      contentHash: info.contentHash,
    };
  }

  /**
   * 公共图片检查：类型/大小/查重 + sharp 分析（尺寸/主色/缩略图）+ 分辨率门槛
   * declaredMime 为客户端声明，须与 sharp 推断的真实格式一致（防伪造类型）
   */
  private async inspectImage(
    buffer: Buffer,
    size: number,
    declaredMime?: string,
  ): Promise<{
    contentHash: string;
    format: keyof typeof EXTENSIONS;
    mimeType: string;
    width: number;
    height: number;
    aspectRatio: number;
    dominantColor: string;
    colorBucket: string;
    thumbnailBuffer: Buffer;
    previewBuffer: Buffer;
  }> {
    if (
      declaredMime &&
      !(WALLPAPER_ALLOWED_MIME as readonly string[]).includes(declaredMime)
    ) {
      throw new BadRequestException(
        "不支持的文件类型，仅支持 JPG、PNG、WebP 格式",
      );
    }
    // 腾讯云审核接口最大支持 32MB，上传上限与之对齐
    if (size > WALLPAPER_MAX_BYTES) {
      throw new BadRequestException("文件大小不能超过32MB");
    }

    // 精确查重：相同字节内容直接拒绝（上传前，省 COS/审核费）
    const contentHash = createHash("sha256").update(buffer).digest("hex");
    const dupe = await this.wallpaperRepository.findOne({
      where: { contentHash },
      select: ["id"],
    });
    if (dupe) {
      throw new BadRequestException(
        `检测到重复壁纸（与 #${dupe.id} 完全一致）`,
      );
    }

    let metadata: sharp.Metadata;
    let thumbnailBuffer: Buffer;
    let previewBuffer: Buffer;
    let dominantColor = "#808080";
    let colorBucket = "gray";
    try {
      const pipeline = sharp(buffer, {
        limitInputPixels: 100_000_000,
      });
      metadata = await pipeline.metadata();
      const format = metadata.format as keyof typeof EXTENSIONS | undefined;
      if (
        !format ||
        !EXTENSIONS[format] ||
        !metadata.width ||
        !metadata.height
      ) {
        throw new Error("invalid image metadata");
      }

      // 客户端声明的 MIME 须与真实内容一致（multipart 入口防伪造类型）
      const expectedMime = format === "jpeg" ? "image/jpeg" : `image/${format}`;
      if (declaredMime && declaredMime !== expectedMime) {
        throw new Error("mime type does not match image content");
      }

      // 主色：缩小采样 stats（确定性、轻量）
      const { dominant } = await sharp(buffer, {
        limitInputPixels: 100_000_000,
      })
        .rotate()
        .resize(64, 64, { fit: "inside" })
        .stats();
      const r = dominant.r ?? 128;
      const g = dominant.g ?? 128;
      const b = dominant.b ?? 128;
      dominantColor = rgbToHex(r, g, b);
      colorBucket = rgbToColorBucket(r, g, b);

      thumbnailBuffer = await sharp(buffer, {
        limitInputPixels: 100_000_000,
      })
        .rotate()
        .resize(640, 640, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();

      // 预览图：详情页占位 / 卡片 hover 大图（1600px，省掉原图流量）
      previewBuffer = await sharp(buffer, {
        limitInputPixels: 100_000_000,
      })
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException("图片文件已损坏或格式无效");
    }

    const format = metadata.format as keyof typeof EXTENSIONS;
    const shouldSwapDimensions = [5, 6, 7, 8].includes(
      metadata.orientation ?? 0,
    );
    const width = shouldSwapDimensions ? metadata.height : metadata.width;
    const height = shouldSwapDimensions ? metadata.width : metadata.height;

    // wallhaven 式最低分辨率门槛
    if (resolutionTooSmall(width, height)) {
      throw new BadRequestException(
        `${resolutionRequirementMessage()}，当前为 ${width}×${height}`,
      );
    }

    return {
      contentHash,
      format,
      mimeType: format === "jpeg" ? "image/jpeg" : `image/${format}`,
      width,
      height,
      aspectRatio: Number((width / height).toFixed(2)),
      dominantColor,
      colorBucket,
      thumbnailBuffer,
      previewBuffer,
    };
  }

  /**
   * 处理头像上传：同样走 COS + 审核，返回完整公开 URL
   */
  async processAvatarUpload(
    file: Express.Multer.File,
    userId: number,
  ): Promise<string> {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("头像仅支持 JPG、PNG、WebP 格式");
    }

    const avatarKey = `profile-pictures/user_${userId}_${Date.now()}.webp`;

    let avatarBuffer: Buffer;
    try {
      avatarBuffer = await sharp(file.buffer, { limitInputPixels: 25_000_000 })
        .rotate()
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 85 })
        .toBuffer();
    } catch {
      throw new BadRequestException("头像文件无效");
    }

    try {
      await this.cos.putObject(avatarKey, avatarBuffer, "image/webp");
      const audit = await this.cos.auditImage(avatarKey, avatarBuffer.length);
      if (!audit.passed) {
        await this.cos.deleteObject(avatarKey);
        throw new BadRequestException(`头像不符合上传规范（${audit.label}）`);
      }
      await this.cos.setPublicRead(avatarKey);
      return this.cos.publicUrl(avatarKey);
    } catch (err) {
      await this.cos.deleteObject(avatarKey);
      if (err instanceof BadRequestException) throw err;
      this.logger.error("头像上传/审核失败", (err as Error).message);
      throw new InternalServerErrorException("头像上传失败，请稍后重试");
    }
  }

  /**
   * 删除头像（按完整 URL）；默认头像/GitHub URL/空值跳过
   */
  async deleteAvatar(avatarUrl?: string | null): Promise<void> {
    if (
      !avatarUrl ||
      avatarUrl === "defaultAvatar.png" ||
      avatarUrl === "defaultAvatar.webp" ||
      !avatarUrl.startsWith("http")
    ) {
      return;
    }
    await this.cos.deleteObject(this.cos.keyFromUrl(avatarUrl));
  }

  /**
   * 删除壁纸原图/缩略图/预览图（按完整 URL）
   */
  async deleteUploadedFiles(
    fileUrl: string,
    thumbnailUrl: string,
    previewUrl?: string,
  ): Promise<void> {
    const keys = [fileUrl, thumbnailUrl, previewUrl]
      .filter((u): u is string => !!u && u.startsWith("http"))
      .map((u) => this.cos.keyFromUrl(u));
    await Promise.all(keys.map((k) => this.cos.deleteObject(k)));
  }
}
