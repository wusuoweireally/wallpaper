import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { RolesGuard } from "../../guards/roles.guard";
import { Roles } from "../../decorators/roles.decorator";
import { UserRole } from "../../entities/user.entity";
import { WallpaperService } from "../../services/wallpaper.service";
import { UploadService } from "../../services/upload.service";
import {
  AdminUpdateWallpaperDto,
  AdminWallpaperQueryDto,
  AdminUpdateWallpaperTagsDto,
  AdminBatchFeaturedDto,
  AdminBatchReviewWallpaperDto,
  AdminReviewWallpaperDto,
  AdminWallpaperIdsDto,
} from "../../dto/admin.dto";
import { CurrentUser } from "../../decorators/current-user.decorator";
import type { CurrentUserType } from "../../decorators/current-user.decorator";
import { WallpaperStatus } from "../../entities/wallpaper.entity";

@Controller("admin/wallpapers")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminWallpaperController {
  constructor(
    private readonly wallpaperService: WallpaperService,
    private readonly uploadService: UploadService,
  ) {}

  @Get()
  async list(@Query() query: AdminWallpaperQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const { data, total } = await this.wallpaperService.adminQueryWallpapers(
      page,
      limit,
      {
        search: query.search,
        category: query.category,
        status: query.status !== undefined ? Number(query.status) : undefined,
        uploaderId:
          query.uploaderId !== undefined ? Number(query.uploaderId) : undefined,
      },
    );

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get("stats")
  async stats() {
    return {
      success: true,
      data: await this.wallpaperService.getAdminStats(),
    };
  }

  @Get(":id")
  async detail(@Param("id", ParseIntPipe) id: number) {
    const wallpaper = await this.wallpaperService.findById(id);
    return {
      success: true,
      data: wallpaper,
    };
  }

  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminUpdateWallpaperDto,
  ) {
    const wallpaper = await this.wallpaperService.update(id, dto);
    return {
      success: true,
      message: "壁纸信息已更新",
      data: wallpaper,
    };
  }

  @Patch(":id/review")
  async review(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminReviewWallpaperDto,
    @CurrentUser() admin: CurrentUserType,
  ) {
    const wallpaper = await this.wallpaperService.review(
      id,
      dto.status,
      admin.userId,
      dto.reviewNote,
    );
    return {
      success: true,
      message:
        dto.status === WallpaperStatus.APPROVED
          ? "壁纸已通过审核"
          : "壁纸已驳回",
      data: wallpaper,
    };
  }

  @Patch(":id/tags")
  async updateTags(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AdminUpdateWallpaperTagsDto,
  ) {
    const tags = await this.wallpaperService.updateWallpaperTags(
      id,
      dto.tags || [],
    );
    return {
      success: true,
      message: "标签已更新",
      data: tags,
    };
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number) {
    const wallpaper = await this.wallpaperService.findById(id);
    await this.wallpaperService.delete(id);
    await this.uploadService.deleteUploadedFiles(
      wallpaper.fileUrl,
      wallpaper.thumbnailUrl,
    );
    return {
      success: true,
      message: "壁纸已删除",
    };
  }

  /**
   * 批量删除壁纸
   */
  @Post("batch-delete")
  async batchRemove(@Body() dto: AdminWallpaperIdsDto) {
    const result = await this.wallpaperService.batchDelete(dto.ids);
    await Promise.all(
      result.deletedFiles.map((file) =>
        this.uploadService.deleteUploadedFiles(
          file.fileUrl,
          file.thumbnailUrl || "",
        ),
      ),
    );
    return {
      success: true,
      message: `成功删除 ${result.deletedCount} 个壁纸`,
      data: {
        deletedCount: result.deletedCount,
        failedIds: result.failedIds,
      },
    };
  }

  /**
   * 批量设置/取消推荐
   */
  @Post("batch-featured")
  async batchFeatured(@Body() body: AdminBatchFeaturedDto) {
    const result = await this.wallpaperService.batchSetFeatured(
      body.ids,
      body.isFeatured,
    );
    return {
      success: true,
      message: body.isFeatured
        ? `已将 ${result.updatedCount} 个壁纸设为推荐`
        : `已取消 ${result.updatedCount} 个壁纸的推荐`,
      data: result,
    };
  }

  @Post("batch-review")
  async batchReview(
    @Body() dto: AdminBatchReviewWallpaperDto,
    @CurrentUser() admin: CurrentUserType,
  ) {
    const result = await this.wallpaperService.batchReview(
      dto.ids,
      dto.status,
      admin.userId,
      dto.reviewNote,
    );
    return {
      success: true,
      message:
        dto.status === WallpaperStatus.APPROVED
          ? `已通过 ${result.updatedCount} 张壁纸`
          : `已驳回 ${result.updatedCount} 张壁纸`,
      data: result,
    };
  }
}
