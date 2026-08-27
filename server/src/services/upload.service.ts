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
import { hexToColorBucket } from "./wallpaper-filters";
import { samplePaletteFromImage } from "./color-palette";
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
  /** 主色板 hex，按占比降序 */
  palette: string[];
  contentHash: string;
}

/** sharp 解码像素上限（约 8K 图），防构造图打爆内存 */
const SHARP_PIXEL_LIMIT = 40_000_000;

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
    // 上传即公读是已知取舍：前后端直链预览 UX 依赖它，草稿态公读可接受；
    // 壁纸退出公开态时由 revokePublicAccess 尽力回收（见下）
    try {
      await this.cos.setPublicRead(fileKey);
      await this.cos.putObject(thumbKey, info.thumbnailBuffer, "image/webp");
      await this.cos.setPublicRead(thumbKey);
      await this.cos.putObject(previewKey, info.previewBuffer, "image/webp");
      await this.cos.setPublicRead(previewKey);
    } catch (err) {
      this.logger.error("文件发布失败", (err as Error).message);
      // 清理已公开的对象；删失败的记录 key 留痕（公有读残留是真实风险）
      const keys = [fileKey, thumbKey, previewKey];
      const results = await Promise.all(
        keys.map((k) => this.cos.deleteObject(k)),
      );
      const failedKeys = keys.filter((_, i) => !results[i]);
      if (failedKeys.length > 0) {
        this.logger.error(
          `发布失败后对象清理未完成，需人工处理: ${failedKeys.join(", ")}`,
        );
      }
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
      palette: info.palette,
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
    palette: string[];
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
    let palette = ["#808080"];
    try {
      const pipeline = sharp(buffer, { limitInputPixels: SHARP_PIXEL_LIMIT });
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

      thumbnailBuffer = await pipeline
        .clone()
        .rotate()
        .resize(640, 640, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();

      // 预览图：详情页占位 / 卡片 hover 大图（1600px，省掉原图流量）
      previewBuffer = await pipeline
        .clone()
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();

      // 主色板：从已生成的 640px 缩略图采样（64px 直方图量化），
      // 免去对原图的又一次全量解码
      palette = await samplePaletteFromImage(thumbnailBuffer);
      dominantColor = palette[0] ?? "#808080";
      colorBucket = hexToColorBucket(dominantColor) ?? "gray";
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      // 超出像素上限的合法大图要给出可自救的提示，不能混进"文件损坏"
      if (err instanceof Error && err.message.includes("exceeds pixel limit")) {
        throw new BadRequestException(
          `图片分辨率超过上限（约 ${Math.floor(SHARP_PIXEL_LIMIT / 1_000_000)}MP），请压缩后再上传`,
        );
      }
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
      palette,
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
      avatarBuffer = await sharp(file.buffer, {
        limitInputPixels: SHARP_PIXEL_LIMIT,
      })
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
      if (!(await this.cos.deleteObject(avatarKey))) {
        this.logger.error(`头像对象清理失败，可能残留: ${avatarKey}`);
      }
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

  /** 壁纸退出公开态（下架等）后回收三个对象的公有读，尽力而为：
   * 失败仅记 error 日志留痕、不抛错（对齐 deleteObject 兜底风格），不影响主流程
   */
  async revokePublicAccess(
    fileUrl: string,
    thumbnailUrl?: string,
    previewUrl?: string,
  ): Promise<void> {
    const keys = [fileUrl, thumbnailUrl, previewUrl]
      .filter((u): u is string => !!u && u.startsWith("http"))
      .map((u) => this.cos.keyFromUrl(u));
    const results = await Promise.all(
      keys.map((k) => this.cos.setObjectPrivate(k)),
    );
    const failedKeys = keys.filter((_, i) => !results[i]);
    if (failedKeys.length > 0) {
      this.logger.error(
        `对象转私有未完成，直链可能仍可访问，需人工处理: ${failedKeys.join(", ")}`,
      );
    }
  }

  /**
   * 与 revokePublicAccess 对称：壁纸重新进入公开态（下架后再上架等）恢复
   * 三个对象的公有读——缺了这半边，下架重发的直链会一直 403 裂图。
   * 失败仅记 error 日志留痕、不抛错
   */
  async restorePublicAccess(
    fileUrl: string,
    thumbnailUrl?: string,
    previewUrl?: string,
  ): Promise<void> {
    const keys = [fileUrl, thumbnailUrl, previewUrl]
      .filter((u): u is string => !!u && u.startsWith("http"))
      .map((u) => this.cos.keyFromUrl(u));
    const results = await Promise.all(
      keys.map(async (k) => {
        try {
          await this.cos.setPublicRead(k);
          return true;
        } catch (err) {
          this.logger.error(
            `COS 恢复公有读失败(直链可能 403): ${k} - ${(err as Error).message}`,
          );
          return false;
        }
      }),
    );
    const failedKeys = keys.filter((_, i) => !results[i]);
    if (failedKeys.length > 0) {
      this.logger.error(
        `对象恢复公有读未完成，直链可能仍 403，需人工处理: ${failedKeys.join(", ")}`,
      );
    }
  }
}
