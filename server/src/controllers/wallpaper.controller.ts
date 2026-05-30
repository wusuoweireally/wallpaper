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
  UseGuards,
  Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request } from "express";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { WallpaperService } from "../services/wallpaper.service";
import { UploadService } from "../services/upload.service";
import {
  CreateWallpaperDto,
  UpdateWallpaperDto,
  WallpaperQueryDto,
} from "../dto/wallpaper.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import { verifyOwnership } from "../decorators/ownership.decorator";
import { isAdminRole } from "../entities/user.entity";
import { TagService } from "../services/tag.service";
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
}

@Controller("wallpapers")
export class WallpaperController {
  constructor(
    private readonly wallpaperService: WallpaperService,
    private readonly uploadService: UploadService,
    private readonly tagService: TagService,
    private readonly viewHistoryService: ViewHistoryService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /**
   * 上传壁纸
   */
  @Post("upload")
  @UseGuards(JwtAuthGuard)
  @Throttle({ upload: { limit: 50, ttl: 3600000 } })
  @UseInterceptors(FileInterceptor("file"))
  async uploadWallpaper(
    @UploadedFile() file: Express.Multer.File,
    @Body() createWallpaperDto: CreateWallpaperDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!file) {
      throw new BadRequestException("请选择要上传的文件");
    }

    let fileInfo: {
      fileUrl: string;
      thumbnailUrl?: string;
      fileSize: number;
      width: number;
      height: number;
      format: string;
      aspectRatio: number;
    };

    try {
      // 第一步：处理文件上传（不在事务中）
      fileInfo = await this.uploadService.processWallpaperUpload(
        file,
        user.userId,
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message || "文件处理失败");
      }
      throw new BadRequestException("文件处理失败");
    }

    // 第二步：数据库操作
    // 注意：当前未包裹事务（标签处理在上传成功后执行）。
    // 如需强一致性，可在 Service 层支持事务 EntityManager 后改造。
    try {
      const createData: CreateWallpaperData = {
        ...createWallpaperDto,
        ...fileInfo,
      };

      const wallpaper = await this.wallpaperService.create(
        createData,
        user.userId,
      );

      // 仅管理员可在上传时创建新标签，普通用户只能关联已存在标签
      if (createWallpaperDto.tags && createWallpaperDto.tags.length > 0) {
        await this.tagService.processWallpaperTags(
          wallpaper.id,
          createWallpaperDto.tags,
          isAdminRole(user.role),
        );
      }

      return {
        success: true,
        message: "壁纸上传成功",
      };
    } catch (error) {
      // 如果数据库操作失败，删除已上传的文件
      try {
        await this.uploadService.deleteUploadedFiles(
          fileInfo.fileUrl,
          fileInfo.thumbnailUrl || "",
        );
      } catch (cleanupErr) {
        console.error("文件清理失败:", cleanupErr);
      }

      if (error instanceof Error) {
        throw new BadRequestException(error.message || "上传失败");
      }
      throw new BadRequestException("上传失败");
    }
  }

  /**
   * 获取壁纸列表（支持搜索和筛选）
   */
  @Get()
  async getWallpapers(@Query() query: WallpaperQueryDto) {
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
      search,
      format,
      minFileSize,
      maxFileSize,
    } = query;

    const result = await this.wallpaperService.findAll(
      Number(page),
      Number(limit),
      sortBy,
      sortOrder,
      tags,
      query.tagKeyword,
      minWidth ? Number(minWidth) : undefined,
      maxWidth ? Number(maxWidth) : undefined,
      minHeight ? Number(minHeight) : undefined,
      maxHeight ? Number(maxHeight) : undefined,
      aspectRatio ? Number(aspectRatio) : undefined,
      orientation,
      category,
      subCategory,
      search,
      format,
      minFileSize ? Number(minFileSize) : undefined,
      maxFileSize ? Number(maxFileSize) : undefined,
    );

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
   * 获取热门壁纸（必须放在 :id 路由之前，避免被参数化路由覆盖）
   */
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

  /**
   * 获取近期热门壁纸（最近7天内）
   */
  @Get("trending")
  async getTrendingWallpapers(
    @Query("days") days: string = "7",
    @Query("limit") limit: string = "10",
  ) {
    const wallpapers = await this.wallpaperService.getTrendingWallpapers(
      Number(days),
      Number(limit),
    );
    return { success: true, data: wallpapers };
  }

  /**
   * 获取相关推荐壁纸（同分类随机）
   */
  @Get(":id/related")
  async getRelatedWallpapers(
    @Param("id") id: string,
    @Query("limit") limit: string = "8",
  ) {
    // 先查当前壁纸获取分类
    const wallpaper = await this.wallpaperService.findById(Number(id));
    if (!wallpaper) {
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
   * 获取指定上传者的壁纸列表
   */
  @Get("uploader/:uploaderId")
  async getWallpapersByUploader(
    @Param("uploaderId") uploaderId: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    const id = Number(uploaderId);
    if (isNaN(id)) {
      throw new BadRequestException("无效的上传者ID");
    }

    const result = await this.wallpaperService.findByUploaderId(
      id,
      Number(page),
      Number(limit),
    );

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
   * 获取壁纸详情
   */
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async getWallpaper(@Param("id") id: string, @Req() request: Request) {
    const wallpaperId = Number(id);
    if (isNaN(wallpaperId)) {
      throw new BadRequestException("无效的壁纸ID");
    }

    const wallpaper = await this.wallpaperService.findById(wallpaperId);

    // 增加查看次数
    await this.wallpaperService.incrementViewCount(wallpaperId);

    // 仅在用户已登录时记录浏览历史/点赞收藏状态
    const authUser = request.user as { userId?: number; username?: string };
    let isLiked = false;
    let isFavorited = false;

    if (authUser?.userId) {
      await this.viewHistoryService.createViewHistory({
        userId: authUser.userId,
        wallpaperId,
      });

      // 使用优化方法一次性获取点赞和收藏状态
      const interactionStatus =
        await this.wallpaperService.getUserInteractionStatus(
          wallpaperId,
          authUser.userId,
        );
      isLiked = interactionStatus.isLiked;
      isFavorited = interactionStatus.isFavorited;
    }

    // 处理上传者头像URL，确保返回完整可访问的URL
    const uploader = wallpaper.uploader;
    let avatarUrl: string | null = null;
    if (uploader?.avatarUrl) {
      // 如果头像URL是默认头像，返回默认路径
      if (uploader.avatarUrl === "defaultAvatar.png") {
        avatarUrl = "/uploads/profile-pictures/defaultAvatar.png";
      } else {
        // 为用户上传的头像添加完整路径
        avatarUrl = `/uploads/profile-pictures/${uploader.avatarUrl}`;
      }
    }

    return {
      success: true,
      data: {
        ...wallpaper,
        isLiked,
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
   * 获取壁纸的标签
   */
  @Get(":id/tags")
  async getWallpaperTags(@Param("id") id: string) {
    // 验证壁纸是否存在
    await this.wallpaperService.findById(Number(id));

    const tags = await this.tagService.getTagsByWallpaperId(Number(id));

    return {
      success: true,
      data: tags,
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
    @CurrentUser() user: { userId: number; username: string },
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

    // 删除相关文件
    await this.uploadService.deleteUploadedFiles(
      wallpaper.fileUrl,
      wallpaper.thumbnailUrl,
    );

    return {
      success: true,
      message: "壁纸删除成功",
    };
  }

  /**
   * 记录下载
   */
  @Post(":id/download")
  @UseGuards(JwtAuthGuard)
  async recordDownload(@Param("id") id: string) {
    const wallpaperId = Number(id);
    if (isNaN(wallpaperId)) {
      throw new BadRequestException("无效的壁纸ID");
    }
    await this.wallpaperService.incrementDownloadCount(wallpaperId);
    return { success: true, message: "下载记录成功" };
  }

  /**
   * 切换点赞状态
   */
  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async likeWallpaper(
    @Param("id") id: string,
    @CurrentUser() user: { userId: number; username: string },
  ) {
    const result = await this.wallpaperService.toggleLike(user.userId, Number(id));

    return {
      success: true,
      message: result.isLiked ? "点赞成功" : "取消点赞成功",
      data: result,
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
    const result = await this.wallpaperService.toggleFavorite(user.userId, Number(id));

    return {
      success: true,
      message: result.isFavorited ? "收藏成功" : "取消收藏成功",
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
    await this.wallpaperService.removeFavorite(user.userId, Number(id));
    return { success: true, message: "已取消收藏" };
  }
}
