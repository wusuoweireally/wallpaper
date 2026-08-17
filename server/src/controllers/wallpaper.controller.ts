import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  Logger,
  UseGuards,
  Req,
} from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { WallpaperService } from "../services/wallpaper.service";
import { UploadService } from "../services/upload.service";
import {
  CreateWallpaperDto,
  PublishWallpapersDto,
  UpdateWallpaperDto,
  WallpaperQueryDto,
} from "../dto/wallpaper.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import { verifyOwnership } from "../decorators/ownership.decorator";
import { WallpaperStatus } from "../entities/wallpaper.entity";
import { ViewHistoryService } from "../services/view-history.service";
import { sanitizeUser } from "../utils/sanitize";

interface CreateWallpaperData extends CreateWallpaperDto {
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  aspectRatio: number;
  dominantColor?: string | null;
  colorBucket?: string | null;
  contentHash?: string | null;
  status: WallpaperStatus;
}

@SkipThrottle()
@Controller("wallpapers")
export class WallpaperController {
  private readonly logger = new Logger(WallpaperController.name);

  constructor(
    private readonly wallpaperService: WallpaperService,
    private readonly uploadService: UploadService,
    private readonly viewHistoryService: ViewHistoryService,
  ) {}

  /**
   * 上传壁纸
   */
  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 100, ttl: 3600000 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: 32 * 1024 * 1024, files: 1 },
    }),
  )
  async uploadWallpaper(
    @UploadedFile() file: Express.Multer.File,
    @Body() createWallpaperDto: CreateWallpaperDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!file) {
      throw new BadRequestException("请选择要上传的文件");
    }

    const fileInfo = await this.uploadService.processWallpaperUpload(
      file,
      user.userId,
    );

    try {
      // 第一步：文件入库为草稿（PENDING），分类/标签在第二步 publish 再填
      const createData: CreateWallpaperData = {
        category: createWallpaperDto.category || "general",
        subCategory: createWallpaperDto.subCategory,
        tags: createWallpaperDto.tags || [],
        ...fileInfo,
        status: WallpaperStatus.PENDING,
      };

      const wallpaper = await this.wallpaperService.create(
        createData,
        user.userId,
      );

      return {
        success: true,
        message: "壁纸已上传，请完善分类与标签后发布",
        data: wallpaper,
      };
    } catch (error) {
      try {
        await this.uploadService.deleteUploadedFiles(
          fileInfo.fileUrl,
          fileInfo.thumbnailUrl || "",
          fileInfo.previewUrl,
        );
      } catch (cleanupErr) {
        this.logger.warn("数据库写入失败后的文件清理未完成", cleanupErr);
      }

      if (error instanceof HttpException) throw error;
      this.logger.error("壁纸数据写入失败", error);
      throw new InternalServerErrorException("上传失败，请稍后重试");
    }
  }

  /**
   * 获取壁纸列表（支持搜索和筛选）
   * 已登录时附带 isFavorited，与详情页交互状态一致。
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getWallpapers(
    @Query() query: WallpaperQueryDto,
    @Req() request: Request,
  ) {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
      tags,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      aspectRatio,
      orientation,
      category,
      subCategory,
      format,
      minFileSize,
      maxFileSize,
      topRange,
      color,
      resolutions,
      search,
      seed,
    } = query;

    const viewer = request.user as CurrentUserType | undefined;

    const result = await this.wallpaperService.findAll({
      page: Number(page),
      limit: Number(limit),
      sortBy,
      sortOrder,
      tags,
      minWidth: minWidth ? Number(minWidth) : undefined,
      maxWidth: maxWidth ? Number(maxWidth) : undefined,
      minHeight: minHeight ? Number(minHeight) : undefined,
      maxHeight: maxHeight ? Number(maxHeight) : undefined,
      aspectRatio: aspectRatio ? Number(aspectRatio) : undefined,
      orientation,
      category,
      subCategory,
      format,
      minFileSize: minFileSize ? Number(minFileSize) : undefined,
      maxFileSize: maxFileSize ? Number(maxFileSize) : undefined,
      viewerId: viewer?.userId,
      topRange,
      color,
      resolutions,
      search,
      seed,
    });

    return {
      success: true,
      data: result.data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit)),
      },
    };
  }

  /**
   * 按 sha256 查重（选图阶段用，避免上传后才发现重复）
   * 必须在 @Get(":id") 之前，否则会被参数化路由吞掉
   */
  @Get("check-hash")
  async checkContentHash(@Query("hash") hash: string) {
    if (!hash || !/^[0-9a-f]{64}$/.test(hash)) {
      throw new BadRequestException("无效的内容哈希");
    }
    const data = await this.wallpaperService.checkDuplicate(hash);
    return { success: true, data };
  }

  @Get("popular")
  async getPopularWallpapers(@Query("limit") limit: string = "10") {
    const wallpapers = await this.wallpaperService.getPopularWallpapers(
      Number(limit),
    );

    return {
      success: true,
      data: wallpapers,
    };
  }

  @Get("featured")
  async getFeaturedWallpapers(@Query("limit") limit: string = "10") {
    const wallpapers = await this.wallpaperService.getFeaturedWallpapers(
      Number(limit),
    );
    return { success: true, data: wallpapers };
  }

  /**
   * 获取相关推荐壁纸（同分类随机）
   * 草稿/非公开：本人可看详情但不强求相关，返回空列表避免 404 刷屏
   */
  @Get(":id/related")
  @UseGuards(OptionalJwtAuthGuard)
  async getRelatedWallpapers(
    @Param("id") id: string,
    @Query("limit") limit: string = "8",
    @Req() request: Request,
  ) {
    const authUser = request.user as CurrentUserType | undefined;
    const wallpaper = await this.wallpaperService.findVisibleById(
      Number(id),
      authUser,
    );
    // 未发布不进公网推荐逻辑
    if (wallpaper.status !== WallpaperStatus.APPROVED) {
      return { success: true, data: [] };
    }
    const related = await this.wallpaperService.getRelatedWallpapers(
      Number(id),
      wallpaper.category,
      Number(limit),
    );
    return { success: true, data: related };
  }

  /**
   * 获取壁纸详情
   */
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async getWallpaper(
    @Param("id") id: string,
    @Query("trackView") trackView: string | undefined,
    @Req() request: Request,
  ) {
    const wallpaperId = Number(id);
    if (isNaN(wallpaperId)) {
      throw new BadRequestException("无效的壁纸ID");
    }

    const authUser = request.user as CurrentUserType | undefined;
    const wallpaper = await this.wallpaperService.findVisibleById(
      wallpaperId,
      authUser,
    );

    let isFavorited = false;

    // 浏览量防刷：1 小时内重复浏览不计数
    // 登录用户服务端原子判断（recordView）；游客由前端 localStorage 标记 trackView=0
    if (wallpaper.status === WallpaperStatus.APPROVED) {
      if (authUser?.userId) {
        await this.viewHistoryService.recordView(authUser.userId, wallpaperId);
      } else if (trackView !== "0") {
        await this.wallpaperService.incrementViewCount(wallpaperId);
      }
    }

    if (wallpaper.status === WallpaperStatus.APPROVED && authUser?.userId) {
      isFavorited = await this.wallpaperService.getUserFavoriteStatus(
        wallpaperId,
        authUser.userId,
      );
    }

    // 头像：COS 完整 URL，否则用默认头像
    const uploader = wallpaper.uploader;
    const avatarUrl = uploader?.avatarUrl?.startsWith("http")
      ? uploader.avatarUrl
      : "/defaultAvatar.png";

    return {
      success: true,
      data: {
        ...wallpaper,
        isFavorited,
        uploaderName: wallpaper.uploader?.username || "未知用户",
        uploader: sanitizeUser({
          ...uploader,
          avatarUrl,
        }),
      },
    };
  }

  /**
   * 第二步：发布草稿壁纸（写分类/标签并设为已通过）
   */
  @Post("publish")
  @UseGuards(JwtAuthGuard)
  async publishWallpapers(
    @Body() dto: PublishWallpapersDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const data = await this.wallpaperService.publishDrafts(
      user.userId,
      dto.items,
      user.role,
    );
    return {
      success: true,
      message: `已发布 ${data.length} 张壁纸`,
      data,
    };
  }

  /**
   * 更新壁纸信息
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async updateWallpaper(
    @Param("id") id: string,
    @Body() updateData: UpdateWallpaperDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    // 验证用户权限
    const wallpaper = await this.wallpaperService.findById(Number(id));
    verifyOwnership(wallpaper.uploaderId, user, "修改此壁纸");

    const updatedWallpaper = await this.wallpaperService.update(
      Number(id),
      updateData,
    );

    return {
      success: true,
      message: "壁纸更新成功",
      data: updatedWallpaper,
    };
  }

  /**
   * 删除壁纸
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async deleteWallpaper(
    @Param("id") id: string,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    // 验证用户权限
    const wallpaper = await this.wallpaperService.findById(Number(id));
    verifyOwnership(wallpaper.uploaderId, user, "删除此壁纸");

    await this.wallpaperService.delete(Number(id));

    // 删除相关文件（原图/缩略图/预览图）
    await this.uploadService.deleteUploadedFiles(
      wallpaper.fileUrl,
      wallpaper.thumbnailUrl,
      wallpaper.previewUrl,
    );

    return {
      success: true,
      message: "壁纸删除成功",
    };
  }

  /**
   * 收藏壁纸
   */
  @Post(":id/favorite")
  @UseGuards(JwtAuthGuard)
  async favoriteWallpaper(
    @Param("id") id: string,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const result = await this.wallpaperService.addFavorite(
      user.userId,
      Number(id),
    );

    return {
      success: true,
      message: "收藏成功",
      data: result,
    };
  }

  /**
   * 强制取消收藏（幂等操作）
   */
  @Delete(":id/favorite")
  @UseGuards(JwtAuthGuard)
  async unfavoriteWallpaper(
    @Param("id") id: string,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const result = await this.wallpaperService.removeFavorite(
      user.userId,
      Number(id),
    );
    return { success: true, message: "已取消收藏", data: result };
  }
}
