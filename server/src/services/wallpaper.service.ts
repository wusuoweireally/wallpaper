import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";
import { Wallpaper, WallpaperStatus } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { CreateWallpaperDto } from "../dto/wallpaper.dto";
import { TagService } from "./tag.service";
import { Tag } from "../entities/tag.entity";
import { sanitizeUser } from "../utils/sanitize";
import { normalizeLimit, normalizePagination } from "../common/pagination";
import { isAdminRole, UserRole } from "../entities/user.entity";
import {
  aspectRatioBounds,
  normalizeColorFilter,
  parseResolutionList,
  resolveTopRangeSince,
} from "./wallpaper-filters";

/**
 * 数据万象预览参数：等比缩到 1600 内 + webp q88，语义与上传时 sharp 生成的预览图一致。
 * 仅老数据（previewUrl 为空）现场生成用；URL 即浏览器缓存 key，写死后勿动态变更。
 */
const CI_PREVIEW_PARAMS =
  "imageMogr2/thumbnail/1600x1600/format/webp/quality/88";

/** 列表查询参数（替代超长位置参数） */
export interface WallpaperListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  tags?: string[];
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  aspectRatio?: number;
  orientation?: string;
  category?: "general" | "anime" | "people";
  subCategory?: string;
  format?: string;
  minFileSize?: number;
  maxFileSize?: number;
  viewerId?: number;
  topRange?: string;
  color?: string;
  resolutions?: string[];
  /** 仅查某用户公开上传 */
  uploaderId?: number;
  /** 关键词搜索（按标签名模糊匹配） */
  search?: string;
  /** 随机排序种子：同 seed 翻页顺序稳定 */
  seed?: number;
}

export interface WallpaperViewer {
  userId: number;
  role?: UserRole;
}

function isMysqlDeadlock(error: unknown): boolean {
  const err = error as {
    code?: string;
    errno?: number;
    driverError?: { code?: string; errno?: number };
  };
  return (
    err?.code === "ER_LOCK_DEADLOCK" ||
    err?.errno === 1213 ||
    err?.driverError?.code === "ER_LOCK_DEADLOCK" ||
    err?.driverError?.errno === 1213
  );
}

@Injectable()
export class WallpaperService {
  // 壁纸热门评分公式：浏览x1 + 收藏x8（点赞/下载统计已下线，不参与评分）
  private static readonly POPULARITY_SCORE =
    "(wallpaper.viewCount + wallpaper.favoriteCount * 8)";

  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(UserFavorite)
    private readonly userFavoriteRepository: Repository<UserFavorite>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private tagService: TagService,
  ) {}

  private sanitizeWallpaperUser(wallpaper: Wallpaper): Wallpaper;
  private sanitizeWallpaperUser(wallpaper: Wallpaper[]): Wallpaper[];
  private sanitizeWallpaperUser(
    wallpaper: Wallpaper | Wallpaper[],
  ): Wallpaper | Wallpaper[] {
    const sanitizeOne = (item: Wallpaper): Wallpaper => {
      // 老数据没有预览对象：COS 直链时拼数据万象参数现场生成，体验对齐新上传
      // （非 http 的本地上传老路径不拼，走前端 thumbnail→fileUrl 兜底）
      if (!item.previewUrl && item.fileUrl?.startsWith("http")) {
        item = { ...item, previewUrl: `${item.fileUrl}?${CI_PREVIEW_PARAMS}` };
      }
      if (!item.uploader) {
        return item;
      }

      return {
        ...item,
        uploader: sanitizeUser(
          item.uploader as unknown as Record<string, unknown>,
        ) as unknown as Wallpaper["uploader"],
      };
    };

    return Array.isArray(wallpaper)
      ? wallpaper.map(sanitizeOne)
      : sanitizeOne(wallpaper);
  }

  /**
   * 创建新壁纸
   */
  async create(
    createWallpaperDto: CreateWallpaperDto & {
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
    },
    uploaderId: number,
  ): Promise<Wallpaper> {
    const { tags = [], ...wallpaperData } = createWallpaperDto;
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.dataSource.transaction(async (manager) => {
          const repository = manager.getRepository(Wallpaper);
          const wallpaper = await repository.save(
            repository.create({ ...wallpaperData, uploaderId }),
          );
          // 上传允许自定义标签（不存在则创建）；发布走 replaceWallpaperTags
          await this.tagService.attachWallpaperTags(
            manager,
            wallpaper.id,
            tags,
          );
          return wallpaper;
        });
      } catch (error) {
        lastError = error;
        if (!isMysqlDeadlock(error) || attempt === maxAttempts) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /** 按 contentHash 查重，返回是否已存在与已有 id（选图阶段提前判断） */
  async checkDuplicate(
    contentHash: string,
  ): Promise<{ exists: boolean; id: number | null }> {
    const existing = await this.wallpaperRepository.findOne({
      where: { contentHash },
      select: ["id"],
    });
    return { exists: !!existing, id: existing?.id ?? null };
  }

  /**
   * 根据ID查找壁纸
   */
  async findById(id: number): Promise<Wallpaper> {
    const wallpaper = await this.wallpaperRepository.findOne({
      where: { id },
      relations: ["uploader", "tags"],
    });

    if (!wallpaper) {
      throw new NotFoundException(`壁纸 ID ${id} 不存在`);
    }

    return this.sanitizeWallpaperUser(wallpaper);
  }

  async findVisibleById(
    id: number,
    viewer?: WallpaperViewer,
  ): Promise<Wallpaper> {
    const wallpaper = await this.findById(id);
    if (
      wallpaper.status !== WallpaperStatus.APPROVED &&
      wallpaper.uploaderId !== viewer?.userId &&
      !isAdminRole(viewer?.role)
    ) {
      throw new NotFoundException(`壁纸 ID ${id} 不存在`);
    }

    return wallpaper;
  }

  /**
   * 分页查询壁纸列表（支持搜索和多种筛选）
   */
  async findAll(q: WallpaperListQuery = {}): Promise<{
    data: Array<Wallpaper & { isFavorited: boolean }>;
    total: number;
  }> {
    let page = q.page ?? 1;
    let limit = q.limit ?? 20;
    const sortBy = q.sortBy ?? "createdAt";
    const sortOrder: "ASC" | "DESC" = q.sortOrder ?? "DESC";
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryBuilder = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .where("wallpaper.status = :status", { status: 1 })
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .distinct(true);

    if (q.uploaderId) {
      queryBuilder.andWhere("wallpaper.uploaderId = :uploaderId", {
        uploaderId: q.uploaderId,
      });
    }

    if (q.category) {
      queryBuilder.andWhere("wallpaper.category = :category", {
        category: q.category,
      });
    }

    if (q.subCategory) {
      queryBuilder.andWhere("wallpaper.subCategory = :subCategory", {
        subCategory: q.subCategory,
      });
    }

    if (q.minWidth) {
      queryBuilder.andWhere("wallpaper.width >= :minWidth", {
        minWidth: q.minWidth,
      });
    }
    if (q.maxWidth) {
      queryBuilder.andWhere("wallpaper.width <= :maxWidth", {
        maxWidth: q.maxWidth,
      });
    }
    if (q.minHeight) {
      queryBuilder.andWhere("wallpaper.height >= :minHeight", {
        minHeight: q.minHeight,
      });
    }
    if (q.maxHeight) {
      queryBuilder.andWhere("wallpaper.height <= :maxHeight", {
        maxHeight: q.maxHeight,
      });
    }

    // 精确分辨率（OR 一组 width×height）
    const exactResolutions = parseResolutionList(q.resolutions);
    if (exactResolutions.length > 0) {
      const parts = exactResolutions.map(
        (_, i) =>
          `(wallpaper.width = :resW${i} AND wallpaper.height = :resH${i})`,
      );
      const params: Record<string, number> = {};
      exactResolutions.forEach((r, i) => {
        params[`resW${i}`] = r.width;
        params[`resH${i}`] = r.height;
      });
      queryBuilder.andWhere(`(${parts.join(" OR ")})`, params);
    }

    // 宽高比 ±10%
    if (q.aspectRatio) {
      const { min, max } = aspectRatioBounds(q.aspectRatio);
      queryBuilder
        .andWhere("wallpaper.aspectRatio >= :minRatio", { minRatio: min })
        .andWhere("wallpaper.aspectRatio <= :maxRatio", { maxRatio: max });
    }

    if (q.orientation === "landscape") {
      queryBuilder.andWhere("wallpaper.width > wallpaper.height");
    } else if (q.orientation === "portrait") {
      queryBuilder.andWhere("wallpaper.height > wallpaper.width");
    } else if (q.orientation === "square") {
      queryBuilder.andWhere("wallpaper.width = wallpaper.height");
    }

    if (q.format) {
      queryBuilder.andWhere("wallpaper.format = :format", { format: q.format });
    }

    if (q.minFileSize) {
      queryBuilder.andWhere("wallpaper.fileSize >= :minFileSize", {
        minFileSize: q.minFileSize,
      });
    }
    if (q.maxFileSize) {
      queryBuilder.andWhere("wallpaper.fileSize <= :maxFileSize", {
        maxFileSize: q.maxFileSize,
      });
    }

    // 主色桶
    const colorBucket = normalizeColorFilter(q.color);
    if (colorBucket) {
      queryBuilder.andWhere("wallpaper.colorBucket = :colorBucket", {
        colorBucket,
      });
    }

    // toplist 时间窗
    const since = resolveTopRangeSince(q.topRange);
    if (since) {
      queryBuilder.andWhere("wallpaper.createdAt >= :topSince", {
        topSince: since,
      });
    }

    // 关键词搜索：标签名 LIKE（EXISTS 与多标签 AND 同风格，避免 join 重复）
    const searchTerm = q.search?.trim();
    if (searchTerm) {
      queryBuilder.andWhere(
        `EXISTS (
          SELECT 1 FROM wallpaper_tags wt
          INNER JOIN tags t ON t.id = wt.tag_id
          WHERE wt.wallpaper_id = wallpaper.id AND t.name LIKE :search
        )`,
        { search: `%${searchTerm}%` },
      );
    }

    // 多标签 AND：EXISTS 子查询，避免 leftJoin+groupBy 触发 MySQL ONLY_FULL_GROUP_BY 500
    if (q.tags && q.tags.length > 0) {
      q.tags.forEach((tagName, i) => {
        const param = `filterTag${i}`;
        queryBuilder.andWhere(
          `EXISTS (
            SELECT 1 FROM wallpaper_tags wt
            INNER JOIN tags t ON t.id = wt.tag_id
            WHERE wt.wallpaper_id = wallpaper.id AND t.name = :${param}
          )`,
          { [param]: tagName },
        );
      });
    }

    const validSortFields = [
      "createdAt",
      "viewCount",
      "favoriteCount",
      "width",
      "height",
      "aspectRatio",
      "fileSize",
    ];

    if (sortBy === "random") {
      // 带 seed 的 RAND(N) 确定性排序：翻页传同一 seed 不重复（MySQL 按 seed 初始化随机源）
      if (q.seed !== undefined) {
        queryBuilder
          .orderBy("RAND(:randomSeed)")
          .setParameter("randomSeed", q.seed);
      } else {
        queryBuilder.orderBy("RAND()");
      }
    } else if (sortBy === "popular" || sortBy === "toplist") {
      // toplist / popular：加权综合评分
      queryBuilder.addSelect(
        WallpaperService.POPULARITY_SCORE,
        "popularity_score",
      );
      queryBuilder.orderBy("popularity_score", "DESC");
    } else {
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      queryBuilder.orderBy(`wallpaper.${sortField}`, sortOrder);
      if (sortField !== "id") {
        queryBuilder.addOrderBy("wallpaper.id", sortOrder);
      }
    }

    const [wallpapersWithRelations, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const sanitized = this.sanitizeWallpaperUser(wallpapersWithRelations);
    const data = await this.attachInteractionStatus(sanitized, q.viewerId);
    return { data, total };
  }

  /** 某用户公开（已审核）上传列表 */
  async findPublicUploadsByUser(
    uploaderId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Array<Wallpaper & { isFavorited: boolean }>;
    total: number;
  }> {
    return this.findAll({ page, limit, uploaderId, sortBy: "createdAt" });
  }

  /**
   * 批量为壁纸附加当前用户的收藏状态。
   * 无 viewerId 时全部返回 false，避免额外查询。
   */
  async attachInteractionStatus(
    wallpapers: Wallpaper[],
    viewerId?: number,
  ): Promise<Array<Wallpaper & { isFavorited: boolean }>> {
    if (!viewerId || wallpapers.length === 0) {
      return wallpapers.map((wallpaper) => ({
        ...wallpaper,
        isFavorited: false,
      }));
    }

    const ids = wallpapers.map((wallpaper) => wallpaper.id);
    const favorites = await this.userFavoriteRepository
      .createQueryBuilder("favorite")
      .select("favorite.wallpaperId", "wallpaperId")
      .where("favorite.userId = :viewerId", { viewerId })
      .andWhere("favorite.wallpaperId IN (:...ids)", { ids })
      .getRawMany<{ wallpaperId: string | number }>();

    const favoritedIds = new Set(
      favorites.map((row) => Number(row.wallpaperId)),
    );

    return wallpapers.map((wallpaper) => ({
      ...wallpaper,
      isFavorited: favoritedIds.has(Number(wallpaper.id)),
    }));
  }

  /**
   * 更新壁纸信息（普通字段直写）
   * status 走 setStatus：事务内做标签校验与 usageCount 记账，绕不过发布约束
   */
  async update(id: number, updateData: Partial<Wallpaper>): Promise<Wallpaper> {
    const { status, ...fields } = updateData;
    if (Object.keys(fields).length > 0) {
      await this.wallpaperRepository.update(id, fields);
    }
    if (status !== undefined) {
      await this.setStatus(id, status);
    }
    return await this.findById(id);
  }

  /** 状态切换（0=下架草稿 1=公开）：与 publish/delete 同一套 usageCount 记账 */
  private async setStatus(id: number, status: WallpaperStatus): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const wallpaper = await manager
        .getRepository(Wallpaper)
        .createQueryBuilder("wallpaper")
        .setLock("pessimistic_write")
        .where("wallpaper.id = :id", { id })
        .getOne();
      if (!wallpaper) {
        throw new NotFoundException(`壁纸 ID ${id} 不存在`);
      }
      if (wallpaper.status === status) return;

      if (status === WallpaperStatus.APPROVED) {
        const tagCount = await manager.count(WallpaperTag, {
          where: { wallpaperId: id },
        });
        if (tagCount === 0) {
          throw new BadRequestException(
            `壁纸 #${id} 请至少添加一个标签后再公开`,
          );
        }
        await manager.update(Wallpaper, id, { status });
        await this.adjustTagUsageCount(manager, id, 1);
      } else {
        await manager.update(Wallpaper, id, {
          status: WallpaperStatus.PENDING,
        });
        await this.adjustTagUsageCount(manager, id, -1);
      }
    });
  }

  private async adjustTagUsageCount(
    manager: EntityManager,
    wallpaperId: number,
    delta: 1 | -1,
  ): Promise<void> {
    const relations = await manager.find(WallpaperTag, {
      where: { wallpaperId },
    });
    const tagIds = relations.map((relation) => relation.tagId);
    if (tagIds.length === 0) return;

    const expression =
      delta > 0 ? "usage_count + 1" : "GREATEST(usage_count - 1, 0)";
    await manager
      .getRepository(Tag)
      .createQueryBuilder()
      .update(Tag)
      .set({ usageCount: () => expression })
      .where("id IN (:...tagIds)", { tagIds })
      .execute();
  }

  /**
   * 删除壁纸（包含标签/点赞/收藏等关联清理）- 使用事务保护
   */
  async delete(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const wallpaper = await manager
        .getRepository(Wallpaper)
        .createQueryBuilder("wallpaper")
        .setLock("pessimistic_write")
        .where("wallpaper.id = :id", { id })
        .getOne();
      if (!wallpaper) {
        throw new NotFoundException(`壁纸 ID ${id} 不存在`);
      }

      await manager.delete(UserFavorite, { wallpaperId: id });

      if (wallpaper.status === WallpaperStatus.APPROVED) {
        await this.adjustTagUsageCount(manager, id, -1);
      }
      await manager.delete(WallpaperTag, { wallpaperId: id });

      const result = await manager.delete(Wallpaper, id);
      if (!result.affected) {
        throw new NotFoundException(`壁纸 ID ${id} 不存在`);
      }
    });
  }

  /**
   * 批量删除壁纸
   * @param ids - 壁纸ID数组
   * @returns 删除结果统计
   */
  async batchDelete(ids: number[]): Promise<{
    deletedCount: number;
    failedIds: number[];
    deletedFiles: Array<{
      fileUrl: string;
      thumbnailUrl?: string;
      previewUrl?: string;
    }>;
  }> {
    let deletedCount = 0;
    const failedIds: number[] = [];
    const deletedFiles: Array<{
      fileUrl: string;
      thumbnailUrl?: string;
      previewUrl?: string;
    }> = [];

    // 批量处理（分批执行避免一次性处理太多）
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      for (const id of batch) {
        try {
          const wallpaper = await this.findById(id);
          await this.delete(id);
          deletedCount++;
          deletedFiles.push({
            fileUrl: wallpaper.fileUrl,
            thumbnailUrl: wallpaper.thumbnailUrl,
            previewUrl: wallpaper.previewUrl,
          });
        } catch (error) {
          console.error(`删除壁纸 ID ${id} 失败:`, error);
          failedIds.push(id);
        }
      }
    }

    return { deletedCount, failedIds, deletedFiles };
  }

  /**
   * 增加查看次数
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.wallpaperRepository.increment({ id, status: 1 }, "viewCount", 1);
  }

  /** 用户是否已收藏该壁纸（点赞已下线，仅查收藏） */
  async getUserFavoriteStatus(
    wallpaperId: number,
    userId: number,
  ): Promise<boolean> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { wallpaperId, userId },
      select: ["id"],
    });
    return !!favorite;
  }

  /** 确保收藏记录存在，并返回数据库最终状态。 */
  async addFavorite(
    userId: number,
    wallpaperId: number,
  ): Promise<{ isFavorited: true; favoriteCount: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const userFavoriteRepo = manager.getRepository(UserFavorite);
      const wallpaperRepo = manager.getRepository(Wallpaper);

      const wallpaper = await wallpaperRepo
        .createQueryBuilder("wallpaper")
        .setLock("pessimistic_write")
        .where("wallpaper.id = :wallpaperId", { wallpaperId })
        .andWhere("wallpaper.status = :status", { status: 1 })
        .getOne();
      if (!wallpaper) {
        throw new NotFoundException(`壁纸 ID ${wallpaperId} 不存在`);
      }

      const existingFavorite = await userFavoriteRepo.findOne({
        where: { userId, wallpaperId },
      });

      if (existingFavorite) {
        return {
          isFavorited: true,
          favoriteCount: wallpaper.favoriteCount,
        };
      }

      const userFavorite = userFavoriteRepo.create({ userId, wallpaperId });
      await userFavoriteRepo.save(userFavorite);
      await wallpaperRepo.increment({ id: wallpaperId }, "favoriteCount", 1);
      return {
        isFavorited: true,
        favoriteCount: wallpaper.favoriteCount + 1,
      };
    });
  }

  /**
   * 强制取消收藏（幂等）
   */
  async removeFavorite(
    userId: number,
    wallpaperId: number,
  ): Promise<{ isFavorited: false; favoriteCount: number }> {
    return this.dataSource.transaction(async (manager) => {
      const wallpaperRepo = manager.getRepository(Wallpaper);
      const wallpaper = await wallpaperRepo
        .createQueryBuilder("wallpaper")
        .setLock("pessimistic_write")
        .where("wallpaper.id = :wallpaperId", { wallpaperId })
        .getOne();
      if (!wallpaper) {
        throw new NotFoundException(`壁纸 ID ${wallpaperId} 不存在`);
      }

      const result = await manager.delete(UserFavorite, {
        userId,
        wallpaperId,
      });
      if (result.affected) {
        await wallpaperRepo
          .createQueryBuilder()
          .update(Wallpaper)
          .set({ favoriteCount: () => "GREATEST(favorite_count - 1, 0)" })
          .where("id = :wallpaperId", { wallpaperId })
          .execute();
      }
      return {
        isFavorited: false,
        favoriteCount: result.affected
          ? Math.max(0, wallpaper.favoriteCount - 1)
          : wallpaper.favoriteCount,
      };
    });
  }

  /**
   * 根据上传者ID查询壁纸（本人全部状态，个人中心用）
   */
  async findOwnUploads(
    uploaderId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    if (!uploaderId || isNaN(uploaderId) || uploaderId <= 0) {
      throw new NotFoundException("上传者ID无效");
    }

    ({ page, limit } = normalizePagination(page, limit));
    const [data, total] = await this.wallpaperRepository.findAndCount({
      where: { uploaderId },
      relations: ["uploader", "tags"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data: this.sanitizeWallpaperUser(data), total };
  }

  async getUploaderStats(uploaderId: number): Promise<{ uploads: number }> {
    const result = await this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .select("COUNT(*)", "uploads")
      .where("wallpaper.uploaderId = :uploaderId", { uploaderId })
      .getRawOne<{ uploads: string }>();

    return {
      uploads: Number(result?.uploads ?? 0),
    };
  }

  async adminQueryWallpapers(
    page: number = 1,
    limit: number = 20,
    filters: {
      search?: string;
      status?: number;
      uploaderId?: number;
      category?: "general" | "anime" | "people";
    } = {},
  ): Promise<{ data: Wallpaper[]; total: number }> {
    ({ page, limit } = normalizePagination(page, limit));
    const qb = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags");

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      qb.andWhere("(tags.name LIKE :search)", { search: searchTerm });
    }

    if (filters.status !== undefined) {
      qb.andWhere("wallpaper.status = :status", { status: filters.status });
    }

    if (filters.uploaderId) {
      qb.andWhere("wallpaper.uploaderId = :uploaderId", {
        uploaderId: filters.uploaderId,
      });
    }

    if (filters.category) {
      qb.andWhere("wallpaper.category = :category", {
        category: filters.category,
      });
    }

    const [data, total] = await qb
      .orderBy("wallpaper.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: this.sanitizeWallpaperUser(data), total };
  }

  async getAdminStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    featured: number;
  }> {
    const row = await this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .select("COUNT(*)", "total")
      .addSelect(
        "SUM(CASE WHEN wallpaper.status = :pending THEN 1 ELSE 0 END)",
        "pending",
      )
      .addSelect(
        "SUM(CASE WHEN wallpaper.status = :approved THEN 1 ELSE 0 END)",
        "approved",
      )
      .addSelect(
        "SUM(CASE WHEN wallpaper.status = :approved AND wallpaper.isFeatured = 1 THEN 1 ELSE 0 END)",
        "featured",
      )
      .setParameters({
        pending: WallpaperStatus.PENDING,
        approved: WallpaperStatus.APPROVED,
      })
      .getRawOne<Record<string, string>>();

    return {
      total: Number(row?.total ?? 0),
      pending: Number(row?.pending ?? 0),
      approved: Number(row?.approved ?? 0),
      featured: Number(row?.featured ?? 0),
    };
  }

  async batchSetFeatured(
    ids: number[],
    isFeatured: boolean,
  ): Promise<{ updatedCount: number; failedIds: number[] }> {
    let updatedCount = 0;
    const failedIds: number[] = [];

    for (const id of ids) {
      try {
        const result = await this.wallpaperRepository.update(
          { id, status: WallpaperStatus.APPROVED },
          {
            isFeatured,
          },
        );
        if (result.affected && result.affected > 0) {
          updatedCount++;
        } else {
          failedIds.push(id);
        }
      } catch (error) {
        console.error(`设置壁纸 ID ${id} 推荐状态失败:`, error);
        failedIds.push(id);
      }
    }

    return { updatedCount, failedIds };
  }

  async updateWallpaperTags(
    wallpaperId: number,
    tags: string[],
  ): Promise<Tag[]> {
    return this.tagService.replaceWallpaperTags(wallpaperId, tags);
  }

  /**
   * 发布草稿：校验所有权 → 事务内写分类/标签并设为已通过
   * 单张原子（避免"已公开但标签没写进去"的中间态）；批量中某张失败即中断
   */
  async publishDrafts(
    userId: number,
    items: Array<{
      id: number;
      category: "general" | "anime" | "people";
      tags: string[];
    }>,
    role?: UserRole,
  ): Promise<Wallpaper[]> {
    const results: Wallpaper[] = [];
    for (const item of items) {
      const wallpaper = await this.findById(item.id);
      if (wallpaper.uploaderId !== userId && !isAdminRole(role)) {
        throw new ForbiddenException(`无权发布壁纸 #${item.id}`);
      }
      if (
        wallpaper.status !== WallpaperStatus.PENDING &&
        wallpaper.status !== WallpaperStatus.APPROVED
      ) {
        throw new BadRequestException(`壁纸 #${item.id} 不可发布`);
      }
      const tags = (item.tags || []).map((t) => t.trim()).filter(Boolean);
      if (tags.length === 0) {
        throw new BadRequestException(`壁纸 #${item.id} 请至少添加一个标签`);
      }
      // 事务内：先设 APPROVED 再换标签（replaceWallpaperTags 按 status 记账 usageCount）
      await this.dataSource.transaction(async (manager) => {
        await manager.update(Wallpaper, item.id, {
          category: item.category,
          status: WallpaperStatus.APPROVED,
        });
        await this.tagService.replaceWallpaperTags(item.id, tags, manager);
      });
      results.push(await this.findById(item.id));
    }
    return this.sanitizeWallpaperUser(results);
  }

  /**
   * 获取相关推荐壁纸（同分类，排除当前壁纸）
   */
  async getRelatedWallpapers(
    wallpaperId: number,
    category: string,
    limit: number = 8,
  ): Promise<Wallpaper[]> {
    limit = normalizeLimit(limit, 8, 50);
    const baseQb = () => {
      const qb = this.wallpaperRepository
        .createQueryBuilder("wallpaper")
        .leftJoinAndSelect("wallpaper.uploader", "uploader")
        .leftJoinAndSelect("wallpaper.tags", "tags")
        .where("wallpaper.status = :status", { status: 1 })
        .andWhere("wallpaper.id != :id", { id: wallpaperId });
      if (category) {
        qb.andWhere("wallpaper.category = :category", { category });
      }
      return qb;
    };

    // 随机起点替代 ORDER BY RAND()（避免全表扫描计算随机数）
    const maxId = await this.wallpaperRepository
      .createQueryBuilder("w")
      .select("MAX(w.id)", "max")
      .getRawOne<{ max: number }>();
    const offset = maxId?.max ? Math.floor(Math.random() * maxId.max) : 0;

    // 第一段：从随机起点往后取
    const first = await baseQb()
      .andWhere("wallpaper.id >= :offset", { offset })
      .orderBy("wallpaper.id", "ASC")
      .take(limit)
      .getMany();

    // 兜底回绕：起点太靠后导致不足时，从头补齐，避免推荐偶发为空
    let wallpapers = first;
    if (first.length < limit && offset > 0) {
      const rest = await baseQb()
        .andWhere("wallpaper.id < :offset", { offset })
        .orderBy("wallpaper.id", "ASC")
        .take(limit - first.length)
        .getMany();
      wallpapers = [...first, ...rest];
    }

    return this.sanitizeWallpaperUser(wallpapers);
  }

  /**
   * 获取热门壁纸
   * 加权综合评分：浏览x1 + 收藏x8
   */
  async getPopularWallpapers(limit: number = 10): Promise<Wallpaper[]> {
    limit = normalizeLimit(limit, 10, 50);
    // 加权综合评分：浏览x1 + 点赞x5 + 收藏x8 + 下载x3
    const wallpapers = await this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .addSelect(WallpaperService.POPULARITY_SCORE, "popularity_score")
      .where("wallpaper.status = :status", { status: 1 })
      .orderBy("popularity_score", "DESC")
      .take(limit)
      .getMany();

    return this.sanitizeWallpaperUser(wallpapers);
  }

  async getFeaturedWallpapers(limit: number = 10): Promise<Wallpaper[]> {
    limit = normalizeLimit(limit, 10, 50);
    const wallpapers = await this.wallpaperRepository.find({
      where: {
        status: WallpaperStatus.APPROVED,
        isFeatured: true,
      },
      relations: ["uploader", "tags"],
      order: { createdAt: "DESC", id: "DESC" },
      take: limit,
    });
    return this.sanitizeWallpaperUser(wallpapers);
  }

  /** 用户收藏数（仅公开壁纸；个人中心统计用，COUNT 替代拉整行） */
  async countUserFavorites(userId: number): Promise<number> {
    return await this.userFavoriteRepository
      .createQueryBuilder("favorite")
      .innerJoin(
        "favorite.wallpaper",
        "wallpaper",
        "wallpaper.status = :status",
        {
          status: WallpaperStatus.APPROVED,
        },
      )
      .where("favorite.userId = :userId", { userId })
      .getCount();
  }

  /**
   * 获取用户收藏的壁纸列表（分页）
   */
  async getUserFavoritedWallpapers(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const qb = this.userFavoriteRepository
      .createQueryBuilder("favorite")
      .leftJoinAndSelect("favorite.wallpaper", "wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .where("favorite.userId = :userId", { userId })
      .andWhere("wallpaper.status = :status", { status: 1 })
      .orderBy("favorite.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    const [favorites, total] = await qb.getManyAndCount();
    const wallpapers = favorites
      .map((favorite) => favorite.wallpaper)
      .filter(Boolean)
      .map((wallpaper) => ({ ...wallpaper, isFavorited: true }));

    return { data: this.sanitizeWallpaperUser(wallpapers), total };
  }
}
