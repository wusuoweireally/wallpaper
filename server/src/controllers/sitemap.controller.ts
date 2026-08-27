import { Controller, Get, Header, Logger } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, MoreThan, Repository } from "typeorm";
import { Post, PostStatus } from "../entities/post.entity";
import { Tag } from "../entities/tag.entity";
import { Wallpaper, WallpaperStatus } from "../entities/wallpaper.entity";

// 单个 sitemap 文件上限 5 万条 URL，留安全余量做截断阈值
const MAX_URLS = 45000;
const BATCH_SIZE = 5000;

// 静态可收录页（与 web/src/router/index.ts 的公开路由逐条核对所得）
const STATIC_PATHS = ["/", "/wallpapers", "/tags", "/forums"];

@Controller()
export class SitemapController {
  private readonly logger = new Logger(SitemapController.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepo: Repository<Wallpaper>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
  ) {}

  /**
   * 公开无鉴权。服务端挂 /sitemap.xml，对外经网关暴露为
   * ${FRONTEND_URL}/api/sitemap.xml（Nginx 剥掉 /api 前缀转发）。
   */
  @Get("sitemap.xml")
  // 公开只读端点且面向爬虫，豁免全局限流避免搜索引擎校验时段吃 429
  @SkipThrottle()
  @Header("Content-Type", "application/xml")
  async sitemap(): Promise<string> {
    const paths = [...STATIC_PATHS];
    let exceeded = false;
    const addAll = (batch: string[]) => {
      for (const p of batch) {
        if (paths.length >= MAX_URLS) {
          exceeded = true;
          return;
        }
        paths.push(p);
      }
    };

    // 自增主键游标翻页，避免一次性大结果集。bigint 列驱动返回字符串，
    // 这里转回 number 做游标（仅在 ID 超 2^53 时才会失真，自增主键达不到）。
    // 壁纸：审核通过（status=1）
    let cursor = 0;
    while (!exceeded) {
      const where: FindOptionsWhere<Wallpaper> = {
        status: WallpaperStatus.APPROVED,
      };
      if (cursor) where.id = MoreThan(cursor);
      const rows = await this.wallpaperRepo.find({
        select: { id: true },
        where,
        order: { id: "ASC" },
        take: BATCH_SIZE,
      });
      if (!rows.length) break;
      addAll(rows.map((r) => `/wallpaper/${r.id}`));
      cursor = Number(rows[rows.length - 1].id);
    }

    // 标签：前端实际路由用数值 id 跳详情（非 slug）
    let tagCursor = 0;
    while (!exceeded) {
      const where: FindOptionsWhere<Tag> = {};
      if (tagCursor) where.id = MoreThan(tagCursor);
      const rows = await this.tagRepo.find({
        select: { id: true },
        where,
        order: { id: "ASC" },
        take: BATCH_SIZE,
      });
      if (!rows.length) break;
      addAll(rows.map((r) => `/tag/${r.id}`));
      tagCursor = Number(rows[rows.length - 1].id);
    }

    // 论坛帖：仅已发布
    let postCursor = 0;
    while (!exceeded) {
      const where: FindOptionsWhere<Post> = { status: PostStatus.PUBLISHED };
      if (postCursor) where.id = MoreThan(postCursor);
      const rows = await this.postRepo.find({
        select: { id: true },
        where,
        order: { id: "ASC" },
        take: BATCH_SIZE,
      });
      if (!rows.length) break;
      addAll(rows.map((r) => `/forums/post/${r.id}`));
      postCursor = Number(rows[rows.length - 1].id);
    }

    if (exceeded) {
      this.logger.warn(`sitemap 已达 ${MAX_URLS} 条截断上限`);
    }

    // 生产由环境校验强制注入 FRONTEND_URL，兜底只为本地开发不产出相对地址
    const host = (
      this.configService.get<string>("FRONTEND_URL") ||
      process.env.FRONTEND_URL ||
      "http://localhost:1234"
    ).replace(/\/+$/, "");

    return (
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths.map((p) => `<url><loc>${host}${p}</loc></url>`).join("") +
      "</urlset>"
    );
  }
}
