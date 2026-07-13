import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import sharp from "sharp";
import * as fs from "fs/promises";
import * as path from "path";
import { randomBytes } from "crypto";

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadsDir = path.join(process.cwd(), "uploads");

  /**
   * 处理壁纸文件上传
   * @param file 上传的文件
   * @param uploaderId 上传者ID
   * @returns 壁纸信息对象
   */
  async processWallpaperUpload(
    file: Express.Multer.File,
    uploaderId: number,
  ): Promise<{
    fileUrl: string;
    thumbnailUrl: string;
    fileSize: number;
    width: number;
    height: number;
    format: string;
    aspectRatio: number;
  }> {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        "不支持的文件类型，仅支持 JPG、PNG、WebP 格式",
      );
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException("文件大小不能超过50MB");
    }

    const extensions = { jpeg: "jpg", png: "png", webp: "webp" } as const;
    let metadata: sharp.Metadata;
    let thumbnailBuffer: Buffer;
    try {
      metadata = await sharp(file.buffer, {
        limitInputPixels: 100_000_000,
      }).metadata();
      const format = metadata.format as keyof typeof extensions | undefined;
      if (
        !format ||
        !extensions[format] ||
        !metadata.width ||
        !metadata.height
      ) {
        throw new Error("invalid image metadata");
      }

      const expectedMime = format === "jpeg" ? "image/jpeg" : `image/${format}`;
      if (file.mimetype !== expectedMime) {
        throw new Error("mime type does not match image content");
      }

      thumbnailBuffer = await sharp(file.buffer, {
        limitInputPixels: 100_000_000,
      })
        .rotate()
        .resize(640, 640, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      throw new BadRequestException("图片文件已损坏或格式无效");
    }

    const format = metadata.format as keyof typeof extensions;
    const shouldSwapDimensions = [5, 6, 7, 8].includes(
      metadata.orientation ?? 0,
    );
    const width = shouldSwapDimensions ? metadata.height : metadata.width;
    const height = shouldSwapDimensions ? metadata.width : metadata.height;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const nonce = randomBytes(6).toString("hex");
    const fileName = `${timestamp}_${nonce}__${uploaderId}.${extensions[format]}`;
    const thumbnailName = `${timestamp}_${nonce}__${uploaderId}_thumbnail.webp`;
    const fileDir = path.join(this.uploadsDir, "wallpapers");
    const thumbnailsDir = path.join(this.uploadsDir, "thumbnails");
    const filePath = path.join(fileDir, fileName);
    const thumbnailPath = path.join(thumbnailsDir, thumbnailName);
    const temporaryFilePath = `${filePath}.tmp`;
    const temporaryThumbnailPath = `${thumbnailPath}.tmp`;

    try {
      await Promise.all([
        fs.mkdir(fileDir, { recursive: true }),
        fs.mkdir(thumbnailsDir, { recursive: true }),
      ]);
      await fs.writeFile(temporaryFilePath, file.buffer);
      await fs.writeFile(temporaryThumbnailPath, thumbnailBuffer);
      await fs.rename(temporaryFilePath, filePath);
      await fs.rename(temporaryThumbnailPath, thumbnailPath);
    } catch (error) {
      await this.removeFiles([
        temporaryFilePath,
        temporaryThumbnailPath,
        filePath,
        thumbnailPath,
      ]);
      this.logger.error("壁纸文件落盘失败", error);
      throw new InternalServerErrorException("文件保存失败，请稍后重试");
    }

    return {
      fileUrl: `/uploads/wallpapers/${fileName}`,
      thumbnailUrl: `/uploads/thumbnails/${thumbnailName}`,
      fileSize: file.size,
      width,
      height,
      format,
      aspectRatio: Number((width / height).toFixed(2)),
    };
  }

  async processAvatarUpload(
    file: Express.Multer.File,
    userId: number,
  ): Promise<string> {
    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException("头像仅支持 JPG、PNG、WebP 格式");
    }

    const fileName = `user_${userId}_${Date.now()}.webp`;
    const directory = path.join(this.uploadsDir, "profile-pictures");
    await fs.mkdir(directory, { recursive: true });

    try {
      await sharp(file.buffer, { limitInputPixels: 25_000_000 })
        .rotate()
        .resize(512, 512, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(path.join(directory, fileName));
      return fileName;
    } catch {
      throw new BadRequestException("头像文件无效");
    }
  }

  async deleteAvatar(fileName?: string | null): Promise<void> {
    if (
      !fileName ||
      fileName === "defaultAvatar.png" ||
      fileName === "defaultAvatar.webp" ||
      fileName.startsWith("http")
    ) {
      return;
    }

    await fs
      .unlink(
        path.join(this.uploadsDir, "profile-pictures", path.basename(fileName)),
      )
      .catch(() => {});
  }

  /**
   * 删除上传的文件
   */
  async deleteUploadedFiles(
    fileUrl: string,
    thumbnailUrl: string,
  ): Promise<void> {
    const paths = [
      fileUrl
        ? path.join(this.uploadsDir, "wallpapers", path.basename(fileUrl))
        : "",
      thumbnailUrl
        ? path.join(this.uploadsDir, "thumbnails", path.basename(thumbnailUrl))
        : "",
    ].filter(Boolean);
    await this.removeFiles(paths);
  }

  private async removeFiles(paths: string[]): Promise<void> {
    await Promise.all(
      paths.map(async (filePath) => {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            this.logger.warn(`文件清理失败: ${filePath}`, error);
          }
        }
      }),
    );
  }
}
