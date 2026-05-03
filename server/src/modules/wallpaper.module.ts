import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";

import { WallpaperController } from "../controllers/wallpaper.controller";
import { WallpaperService } from "../services/wallpaper.service";
import { UploadService } from "../services/upload.service";
import { ViewHistoryService } from "../services/view-history.service";
import { Wallpaper } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { Tag } from "../entities/tag.entity";
import { ViewHistory } from "../entities/view-history.entity";
import { UserLike } from "../entities/user-like.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { User } from "../entities/user.entity";
import { TagModule } from "./tag.module";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { DemoSeedService } from "../services/demo-seed.service";

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Wallpaper,
      WallpaperTag,
      Tag,
      ViewHistory,
      UserLike,
      UserFavorite,
      User,
    ]),
    TagModule,
  ],
  controllers: [WallpaperController],
  providers: [
    WallpaperService,
    UploadService,
    ViewHistoryService,
    DemoSeedService,
    OptionalJwtAuthGuard,
  ],
  exports: [WallpaperService, UploadService, ViewHistoryService],
})
export class WallpaperModule {}
