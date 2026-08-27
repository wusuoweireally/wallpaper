import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WallpaperController } from "../controllers/wallpaper.controller";
import { CollectionController } from "../controllers/collection.controller";
import { WallpaperService } from "../services/wallpaper.service";
import { CollectionService } from "../services/collection.service";
import { UploadService } from "../services/upload.service";
import { CosService } from "../services/cos.service";
import { ViewHistoryService } from "../services/view-history.service";
import { Wallpaper } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { Tag } from "../entities/tag.entity";
import { ViewHistory } from "../entities/view-history.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { User } from "../entities/user.entity";
import { Collection } from "../entities/collection.entity";
import { CollectionWallpaper } from "../entities/collection-wallpaper.entity";
import { TagModule } from "./tag.module";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { DemoSeedService } from "../services/demo-seed.service";
import { PaletteBackfillService } from "../services/palette-backfill.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallpaper,
      WallpaperTag,
      Tag,
      ViewHistory,
      UserFavorite,
      User,
      Collection,
      CollectionWallpaper,
    ]),
    TagModule,
  ],
  controllers: [WallpaperController, CollectionController],
  providers: [
    WallpaperService,
    CollectionService,
    UploadService,
    CosService,
    ViewHistoryService,
    DemoSeedService,
    PaletteBackfillService,
    OptionalJwtAuthGuard,
  ],
  exports: [
    WallpaperService,
    CollectionService,
    UploadService,
    CosService,
    ViewHistoryService,
  ],
})
export class WallpaperModule {}
