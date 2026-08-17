import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { CollectionService } from "../services/collection.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import {
  CollectionWallpaperDto,
  CreateCollectionDto,
  UpdateCollectionDto,
} from "../dto/wallpaper.dto";

@Controller("collections")
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  /** 当前用户的合集列表；带 wallpaperId 时附返回已包含该壁纸的合集 ID */
  @Get()
  @UseGuards(JwtAuthGuard)
  async listMine(
    @CurrentUser() user: CurrentUserType,
    @Query("wallpaperId") wallpaperId?: string,
  ) {
    const data = await this.collectionService.listByUser(user.userId);
    const id = Number(wallpaperId);
    const containingIds =
      Number.isSafeInteger(id) && id > 0
        ? await this.collectionService.findIdsContaining(user.userId, id)
        : [];
    return { success: true, data, containingIds };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateCollectionDto,
  ) {
    const data = await this.collectionService.create(user.userId, dto.name);
    return { success: true, message: "合集已创建", data };
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async rename(
    @CurrentUser() user: CurrentUserType,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCollectionDto,
  ) {
    const data = await this.collectionService.rename(user.userId, id, dto.name);
    return { success: true, data };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(
    @CurrentUser() user: CurrentUserType,
    @Param("id", ParseIntPipe) id: number,
  ) {
    await this.collectionService.remove(user.userId, id);
    return { success: true, message: "合集已删除" };
  }

  @Get(":id/wallpapers")
  @UseGuards(JwtAuthGuard)
  async listItems(
    @CurrentUser() user: CurrentUserType,
    @Param("id", ParseIntPipe) id: number,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
  ) {
    const result = await this.collectionService.listItems(
      id,
      Number(page),
      Number(limit),
      user.userId,
    );
    return {
      success: true,
      data: result.data,
      collection: result.collection,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit)) || 1,
      },
    };
  }

  @Post(":id/wallpapers")
  @UseGuards(JwtAuthGuard)
  async addWallpaper(
    @CurrentUser() user: CurrentUserType,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CollectionWallpaperDto,
  ) {
    const data = await this.collectionService.addWallpaper(
      user.userId,
      id,
      dto.wallpaperId,
    );
    return { success: true, message: "已加入合集", data };
  }

  @Delete(":id/wallpapers/:wallpaperId")
  @UseGuards(JwtAuthGuard)
  async removeWallpaper(
    @CurrentUser() user: CurrentUserType,
    @Param("id", ParseIntPipe) id: number,
    @Param("wallpaperId", ParseIntPipe) wallpaperId: number,
  ) {
    await this.collectionService.removeWallpaper(user.userId, id, wallpaperId);
    return { success: true, message: "已移出合集" };
  }
}
