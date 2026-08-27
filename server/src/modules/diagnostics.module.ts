import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientErrorController } from "../controllers/client-error.controller";
import { SitemapController } from "../controllers/sitemap.controller";
import { Post } from "../entities/post.entity";
import { Tag } from "../entities/tag.entity";
import { Wallpaper } from "../entities/wallpaper.entity";

/** 无鉴权诊断类路由：客户端错误上报 + sitemap */
@Module({
  imports: [TypeOrmModule.forFeature([Wallpaper, Tag, Post])],
  controllers: [ClientErrorController, SitemapController],
})
export class DiagnosticsModule {}
