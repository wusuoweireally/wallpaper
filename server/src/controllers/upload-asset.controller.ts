import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { access } from "fs/promises";
import { basename, extname, join } from "path";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import { WallpaperService } from "../services/wallpaper.service";
import { WallpaperStatus } from "../entities/wallpaper.entity";

const CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

@SkipThrottle()
@Controller("uploads")
export class UploadAssetController {
  constructor(private readonly wallpaperService: WallpaperService) {}

  @Get(":kind/:fileName")
  @UseGuards(OptionalJwtAuthGuard)
  async getWallpaperAsset(
    @Param("kind") kind: string,
    @Param("fileName") fileName: string,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    if (!["wallpapers", "thumbnails"].includes(kind)) {
      throw new NotFoundException("文件不存在");
    }

    const safeName = basename(fileName);
    if (safeName !== fileName) {
      throw new BadRequestException("文件名无效");
    }

    const assetUrl = `/uploads/${kind}/${safeName}`;
    const wallpaper = await this.wallpaperService.findVisibleByAssetUrl(
      assetUrl,
      request.user as CurrentUserType | undefined,
    );
    const filePath = join(process.cwd(), "uploads", kind, safeName);

    try {
      await access(filePath);
    } catch {
      throw new NotFoundException("文件不存在");
    }

    response.set({
      "Cache-Control":
        wallpaper.status === WallpaperStatus.APPROVED
          ? "public, max-age=0, must-revalidate"
          : "private, no-store",
      "Content-Type":
        CONTENT_TYPES[extname(safeName).toLowerCase()] ||
        "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    response.sendFile(filePath);
  }
}
