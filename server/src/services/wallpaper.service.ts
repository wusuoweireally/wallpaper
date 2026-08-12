import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource, EntityManager } from "typeorm";
import { Wallpaper, WallpaperStatus } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { UserLike } from "../entities/user-like.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { CreateWallpaperDto } from "../dto/wallpaper.dto";
import { TagService } from "./tag.service";
import { Tag } from "../entities/tag.entity";
import { sanitizeUser } from "../utils/sanitize";
import { normalizeLimit, normalizePagination } from "../common/pagination";
import { isAdminRole, UserRole } from "../entities/user.entity";

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
  // 壁纸热门评分公式：浏览x1 + 点赞x5 + 收藏x8 + 下载x3
  private static readonly POPULARITY_SCORE =
    "(wallpaper.viewCount + wallpaper.likeCount * 5 + wallpaper.favoriteCount * 8 + wallpaper.downloadCount * 3)";

  constructor(
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepository: Repository<Wallpaper>,
    @InjectRepository(UserLike)
    private readonly userLikeRepository: Repository<UserLike>,
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
    },
    uploaderId: number,
    allowCreateTags = false,
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
          await this.tagService.attachWallpaperTags(
            manager,
            wallpaper.id,
            tags,
            allowCreateTags,
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

  async findPublishedById(id: number): Promise<Wallpaper> {
    const wallpaper = await this.wallpaperRepository.findOne({
      where: { id, status: WallpaperStatus.APPROVED },
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
  async findAll(
    page: number = 1,
    limit: number = 20,
    sortBy: string = "createdAt",
    sortOrder: "ASC" | "DESC" = "DESC",
    tags?: string[],
    tagKeyword?: string,
    minWidth?: number,
    maxWidth?: number,
    minHeight?: number,
    maxHeight?: number,
    aspectRatio?: number,
    orientation?: string,
    category?: "general" | "anime" | "people",
    subCategory?: string,
    search?: string,
    format?: string,
    minFileSize?: number,
    maxFileSize?: number,
    viewerId?: number,
  ): Promise<{
    data: Array<Wallpaper & { isLiked: boolean; isFavorited: boolean }>;
    total: number;
  }> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryBuilder = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .where("wallpaper.status = :status", { status: 1 })
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .distinct(true);

    // 搜索：匹配标签名
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere("(tags.name LIKE :search)", { search: searchTerm });
    }

    // 添加分类筛选
    if (category) {
      queryBuilder.andWhere("wallpaper.category = :category", { category });
    }

    // 添加子分类筛选
    if (subCategory) {
      queryBuilder.andWhere("wallpaper.subCategory = :subCategory", {
        subCategory,
      });
    }

    // 添加尺寸筛选
    if (minWidth) {
      queryBuilder.andWhere("wallpaper.width >= :minWidth", { minWidth });
    }
    if (maxWidth) {
      queryBuilder.andWhere("wallpaper.width <= :maxWidth", { maxWidth });
    }
    if (minHeight) {
      queryBuilder.andWhere("wallpaper.height >= :minHeight", { minHeight });
    }
    if (maxHeight) {
      queryBuilder.andWhere("wallpaper.height <= :maxHeight", { maxHeight });
    }

    // 添加宽高比筛选（±10% 容差）
    if (aspectRatio) {
      const tolerance = aspectRatio * 0.1;
      queryBuilder
        .andWhere("wallpaper.aspectRatio >= :minRatio", {
          minRatio: aspectRatio - tolerance,
        })
        .andWhere("wallpaper.aspectRatio <= :maxRatio", {
          maxRatio: aspectRatio + tolerance,
        });
    }

    // 添加方向筛选
    if (orientation === "landscape") {
      queryBuilder.andWhere("wallpaper.width > wallpaper.height");
    } else if (orientation === "portrait") {
      queryBuilder.andWhere("wallpaper.height > wallpaper.width");
    } else if (orientation === "square") {
      queryBuilder.andWhere("wallpaper.width = wallpaper.height");
    }

    // 添加文件格式筛选
    if (format) {
      queryBuilder.andWhere("wallpaper.format = :format", { format });
    }

    // 添加文件大小筛选
    if (minFileSize) {
      queryBuilder.andWhere("wallpaper.fileSize >= :minFileSize", {
        minFileSize,
      });
    }
    if (maxFileSize) {
      queryBuilder.andWhere("wallpaper.fileSize <= :maxFileSize", {
        maxFileSize,
      });
    }

    // 添加标签筛选
    if (tags && tags.length > 0) {
      queryBuilder
        .innerJoin("wallpaper.tags", "filterTags")
        .andWhere("filterTags.name IN (:...filterTags)", { filterTags: tags });
    }

    if (tagKeyword && tagKeyword.trim()) {
      queryBuilder.andWhere("tags.name LIKE :tagKeyword", {
        tagKeyword: `%${tagKeyword.trim()}%`,
      });
    }

    // 添加排序
    const validSortFields = [
      "createdAt",
      "viewCount",
      "likeCount",
      "favoriteCount",
      "downloadCount",
      "width",
      "height",
      "aspectRatio",
      "fileSize",
    ];

    // 处理特殊排序逻辑
    if (sortBy === "random") {
      queryBuilder.orderBy("RAND()");
    } else if (sortBy === "popular") {
      // 热门排序：加权综合评分
      // 浏览x1 + 点赞x5 + 收藏x8 + 下载x3
      queryBuilder.addSelect(
        WallpaperService.POPULARITY_SCORE,
        "popularity_score",
      );
      queryBuilder.orderBy("popularity_score", "DESC");
    } else {
      // 常规字段排序
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      queryBuilder.orderBy(`wallpaper.${sortField}`, sortOrder);
      // 同秒写入时保证顺序稳定，避免分页抖动
      if (sortField !== "id") {
        queryBuilder.addOrderBy("wallpaper.id", sortOrder);
      }
    }

    // 执行完整的分页查询 - 修复：单次查询获取所有数据，保持排序
    const [wallpapersWithRelations, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const sanitized = this.sanitizeWallpaperUser(wallpapersWithRelations);
    const data = await this.attachInteractionStatus(sanitized, viewerId);
    return { data, total };
  }

  /**
   * 批量为壁纸附加当前用户的点赞/收藏状态。
   * 无 viewerId 时全部返回 false，避免额外查询。
   */
  async attachInteractionStatus(
    wallpapers: Wallpaper[],
    viewerId?: number,
  ): Promise<Array<Wallpaper & { isLiked: boolean; isFavorited: boolean }>> {
    if (!viewerId || wallpapers.length === 0) {
      return wallpapers.map((wallpaper) => ({
        ...wallpaper,
        isLiked: false,
        isFavorited: false,
      }));
    }

    const ids = wallpapers.map((wallpaper) => wallpaper.id);
    const [likes, favorites] = await Promise.all([
      this.userLikeRepository
        .createQueryBuilder("like")
        .select("like.wallpaperId", "wallpaperId")
        .where("like.userId = :viewerId", { viewerId })
        .andWhere("like.wallpaperId IN (:...ids)", { ids })
        .getRawMany<{ wallpaperId: string | number }>(),
      this.userFavoriteRepository
        .createQueryBuilder("favorite")
        .select("favorite.wallpaperId", "wallpaperId")
        .where("favorite.userId = :viewerId", { viewerId })
        .andWhere("favorite.wallpaperId IN (:...ids)", { ids })
        .getRawMany<{ wallpaperId: string | number }>(),
    ]);

    const likedIds = new Set(likes.map((row) => Number(row.wallpaperId)));
    const favoritedIds = new Set(
      favorites.map((row) => Number(row.wallpaperId)),
    );

    return wallpapers.map((wallpaper) => ({
      ...wallpaper,
      isLiked: likedIds.has(Number(wallpaper.id)),
      isFavorited: favoritedIds.has(Number(wallpaper.id)),
    }));
  }

  /**
   * 更新壁纸信息
   */
  async update(id: number, updateData: Partial<Wallpaper>): Promise<Wallpaper> {
    await this.wallpaperRepository.update(id, updateData);
    return await this.findById(id);
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

      await manager.delete(UserLike, { wallpaperId: id });
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
    deletedFiles: Array<{ fileUrl: string; thumbnailUrl?: string }>;
  }> {
    let deletedCount = 0;
    const failedIds: number[] = [];
    const deletedFiles: Array<{ fileUrl: string; thumbnailUrl?: string }> = [];

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

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: number): Promise<void> {
    const result = await this.wallpaperRepository.increment(
      { id, status: 1 },
      "downloadCount",
      1,
    );
    if (result.affected === 0) {
      throw new NotFoundException(`壁纸 ID ${id} 不存在`);
    }
  }

  /** 确保点赞记录存在，并返回数据库最终状态。 */
  async addLike(
    userId: number,
    wallpaperId: number,
  ): Promise<{ isLiked: true; likeCount: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const userLikeRepo = manager.getRepository(UserLike);
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

      const existingLike = await userLikeRepo.findOne({
        where: { userId, wallpaperId },
      });

      if (existingLike) {
        return { isLiked: true, likeCount: wallpaper.likeCount };
      }

      const userLike = userLikeRepo.create({ userId, wallpaperId });
      await userLikeRepo.save(userLike);
      await wallpaperRepo.increment({ id: wallpaperId }, "likeCount", 1);
      return { isLiked: true, likeCount: wallpaper.likeCount + 1 };
    });
  }

  /**
   * 强制取消点赞（幂等）
   */
  async removeLike(
    userId: number,
    wallpaperId: number,
  ): Promise<{ isLiked: false; likeCount: number }> {
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

      const result = await manager.delete(UserLike, { userId, wallpaperId });
      if (result.affected) {
        await wallpaperRepo
          .createQueryBuilder()
          .update(Wallpaper)
          .set({ likeCount: () => "GREATEST(like_count - 1, 0)" })
          .where("id = :wallpaperId", { wallpaperId })
          .execute();
      }
      return {
        isLiked: false,
        likeCount: result.affected
          ? Math.max(0, wallpaper.likeCount - 1)
          : wallpaper.likeCount,
      };
    });
  }

  /**
   * 获取用户对壁纸的交互状态（点赞和收藏）
   * 使用单次查询优化性能
   */
  async getUserInteractionStatus(
    wallpaperId: number,
    userId: number,
  ): Promise<{ isLiked: boolean; isFavorited: boolean }> {
    // 并行查询点赞和收藏状态（已在 controller 层使用 Promise.all）
    const [like, favorite] = await Promise.all([
      this.userLikeRepository.findOne({
        where: { wallpaperId, userId },
        select: ["id"], // 只查询 ID，减少数据传输
      }),
      this.userFavoriteRepository.findOne({
        where: { wallpaperId, userId },
        select: ["id"],
      }),
    ]);

    return {
      isLiked: !!like,
      isFavorited: !!favorite,
    };
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
   * 根据上传者ID查询壁纸
   */
  async findByUploaderId(
    uploaderId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    // 验证上传者ID的有效性
    if (!uploaderId || isNaN(uploaderId) || uploaderId <= 0) {
      throw new NotFoundException("上传者ID无效");
    }

    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const [data, total] = await this.wallpaperRepository.findAndCount({
      where: { uploaderId, status: 1 },
      relations: ["uploader", "tags"],
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return { data: this.sanitizeWallpaperUser(data), total };
  }

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

  async getUploaderStats(uploaderId: number): Promise<{
    uploads: number;
    likesReceived: number;
  }> {
    const result = await this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .select("COUNT(*)", "uploads")
      .addSelect("COALESCE(SUM(wallpaper.likeCount), 0)", "likesReceived")
      .where("wallpaper.uploaderId = :uploaderId", { uploaderId })
      .getRawOne<{ uploads: string; likesReceived: string }>();

    return {
      uploads: Number(result?.uploads ?? 0),
      likesReceived: Number(result?.likesReceived ?? 0),
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
    rejected: number;
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
        "SUM(CASE WHEN wallpaper.status = :rejected THEN 1 ELSE 0 END)",
        "rejected",
      )
      .addSelect(
        "SUM(CASE WHEN wallpaper.status = :approved AND wallpaper.isFeatured = 1 THEN 1 ELSE 0 END)",
        "featured",
      )
      .setParameters({
        pending: WallpaperStatus.PENDING,
        approved: WallpaperStatus.APPROVED,
        rejected: WallpaperStatus.REJECTED,
      })
      .getRawOne<Record<string, string>>();

    return {
      total: Number(row?.total ?? 0),
      pending: Number(row?.pending ?? 0),
      approved: Number(row?.approved ?? 0),
      rejected: Number(row?.rejected ?? 0),
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
   * 获取相关推荐壁纸（同分类，排除当前壁纸）
   */
  async getRelatedWallpapers(
    wallpaperId: number,
    category: string,
    limit: number = 8,
  ): Promise<Wallpaper[]> {
    limit = normalizeLimit(limit, 8, 50);
    const qb = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .where("wallpaper.status = :status", { status: 1 })
      .andWhere("wallpaper.id != :id", { id: wallpaperId });

    if (category) {
      qb.andWhere("wallpaper.category = :category", { category });
    }

    // 随机偏移替代 ORDER BY RAND()（避免全表扫描计算随机数）
    const maxId = await this.wallpaperRepository
      .createQueryBuilder("w")
      .select("MAX(w.id)", "max")
      .getRawOne<{ max: number }>();
    if (maxId?.max) {
      qb.andWhere("wallpaper.id >= :randomOffset", {
        randomOffset: Math.floor(Math.random() * maxId.max),
      });
    }
    qb.orderBy("wallpaper.id", "ASC").take(limit);

    return this.sanitizeWallpaperUser(await qb.getMany());
  }

  /**
   * 获取热门壁纸
   * 按照浏览量降序排序
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

  /**
   * 获取近期热门壁纸（最近N天内按综合评分排序）
   */
  async getTrendingWallpapers(
    days: number = 7,
    limit: number = 10,
  ): Promise<Wallpaper[]> {
    days = Math.min(30, Math.max(1, Math.trunc(days) || 7));
    limit = normalizeLimit(limit, 10, 50);
    const qb = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .addSelect(WallpaperService.POPULARITY_SCORE, "popularity_score")
      .where("wallpaper.status = :status", { status: 1 })
      .andWhere("wallpaper.createdAt >= :since", {
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      })
      .orderBy("popularity_score", "DESC")
      .take(limit);

    return this.sanitizeWallpaperUser(await qb.getMany());
  }

  /**
   * 获取用户点赞的壁纸列表（分页）
   */
  async getUserLikedWallpapers(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    // 使用 QueryBuilder 确保 total 与 data 基于同一过滤结果集（仅 status=1 的壁纸）
    const qb = this.userLikeRepository
      .createQueryBuilder("like")
      .leftJoinAndSelect("like.wallpaper", "wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .where("like.userId = :userId", { userId })
      .andWhere("wallpaper.status = :status", { status: 1 })
      .orderBy("like.createdAt", "DESC")
      .skip(skip)
      .take(limit);

    const [likes, total] = await qb.getManyAndCount();
    const wallpapers = likes
      .map((like) => like.wallpaper)
      .filter(Boolean)
      .map((wallpaper) => ({ ...wallpaper, isLiked: true }));

    return { data: this.sanitizeWallpaperUser(wallpapers), total };
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
