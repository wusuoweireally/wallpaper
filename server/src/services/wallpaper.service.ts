import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { Wallpaper } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { UserLike } from "../entities/user-like.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { CreateWallpaperDto } from "../dto/wallpaper.dto";
import { TagService } from "./tag.service";
import { Tag } from "../entities/tag.entity";

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
  ): Promise<Wallpaper> {
    // 创建壁纸记录，排除tags字段（通过关联表处理）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tags, ...wallpaperData } = createWallpaperDto;
    const wallpaper = this.wallpaperRepository.create({
      ...wallpaperData,
      uploaderId,
    });

    await this.wallpaperRepository.save(wallpaper);
    return wallpaper;
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
  ): Promise<{ data: Wallpaper[]; total: number }> {
    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryBuilder = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .where("wallpaper.status = :status", { status: 1 })
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .distinct(true);

    // 全文搜索：匹配标题、描述、标签名
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        '(wallpaper.title LIKE :search OR wallpaper.description LIKE :search OR tags.name LIKE :search)',
        { search: searchTerm },
      );
    }

    // 添加分类筛选
    if (category) {
      queryBuilder.andWhere("wallpaper.category = :category", { category });
    }

    // 添加子分类筛选
    if (subCategory) {
      queryBuilder.andWhere("wallpaper.subCategory = :subCategory", { subCategory });
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
        .andWhere("wallpaper.aspectRatio >= :minRatio", { minRatio: aspectRatio - tolerance })
        .andWhere("wallpaper.aspectRatio <= :maxRatio", { maxRatio: aspectRatio + tolerance });
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

    if (process.env.NODE_ENV === "development") {
      console.log(
        `📋 [壁纸列表] 排序参数: sortBy=${sortBy}, sortOrder=${sortOrder}`,
      );
    }

    // 处理特殊排序逻辑
    if (sortBy === "random") {
      // 随机排序
      queryBuilder.orderBy("RAND()");
      if (process.env.NODE_ENV === "development") {
        console.log(`📋 [壁纸列表] 使用随机排序`);
      }
    } else if (sortBy === "popular") {
      // 热门排序：加权综合评分
      // 浏览x1 + 点赞x5 + 收藏x8 + 下载x3
      queryBuilder.addSelect(
        WallpaperService.POPULARITY_SCORE,
        "popularity_score",
      );
      queryBuilder.orderBy("popularity_score", "DESC");
      if (process.env.NODE_ENV === "development") {
        console.log(`📋 [壁纸列表] 使用热门排序(综合评分)`);
      }
    } else {
      // 常规字段排序
      const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
      queryBuilder.orderBy(`wallpaper.${sortField}`, sortOrder);
      if (process.env.NODE_ENV === "development") {
        console.log(`📋 [壁纸列表] 使用字段排序: ${sortField} ${sortOrder}`);
      }
    }

    // 执行完整的分页查询 - 修复：单次查询获取所有数据，保持排序
    const [wallpapersWithRelations, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // 添加排序验证日志
    if (process.env.NODE_ENV === "development") {
      console.log(
        `📋 [壁纸列表] 查询结果: 总数=${total}, 当前页数据=${wallpapersWithRelations.length}`,
      );
      if (wallpapersWithRelations.length > 0) {
        console.log(`📋 [壁纸列表] 排序验证(前5条):`);
        wallpapersWithRelations.slice(0, 5).forEach((wallpaper, index) => {
          let sortFieldValue: string | number;
          if (sortBy === "popular") {
            sortFieldValue = wallpaper.viewCount;
          } else if (sortBy === "createdAt") {
            sortFieldValue = wallpaper.createdAt.toISOString();
          } else {
            const fieldValue = wallpaper[sortBy as keyof Wallpaper];
            sortFieldValue =
              typeof fieldValue === "string" || typeof fieldValue === "number"
                ? fieldValue
                : "N/A";
          }
          console.log(
            `  ${index + 1}. ID:${wallpaper.id} ${sortBy}:${String(sortFieldValue)} 浏览量:${wallpaper.viewCount} 创建时间:${wallpaper.createdAt.toISOString()}`,
          );
        });
      }
    }

    return { data: wallpapersWithRelations, total };
  }

  /**
   * 更新壁纸信息
   */
  async update(id: number, updateData: Partial<Wallpaper>): Promise<Wallpaper> {
    await this.wallpaperRepository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * 删除壁纸（包含标签/点赞/收藏等关联清理）- 使用事务保护
   */
  async delete(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // 在事务内读取关联标签，确保事务隔离一致性
      const wallpaperTags = await manager.find(WallpaperTag, {
        where: { wallpaperId: id },
        relations: ["tag"],
      });

      await manager.delete(UserLike, { wallpaperId: id });
      await manager.delete(UserFavorite, { wallpaperId: id });
      await manager.delete(WallpaperTag, { wallpaperId: id });

      // 标签 usageCount 递减在事务内执行，保证与关联删除原子性
      for (const wt of wallpaperTags) {
        if (wt.tag && wt.tag.usageCount > 0) {
          await manager.decrement(Tag, { id: wt.tagId }, "usageCount", 1);
        }
      }

      const result = await manager.delete(Wallpaper, id);
      if (result.affected === 0) {
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
  }> {
    let deletedCount = 0;
    const failedIds: number[] = [];

    // 批量处理（分批执行避免一次性处理太多）
    const batchSize = 50;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);

      for (const id of batch) {
        try {
          await this.delete(id);
          deletedCount++;
        } catch (error) {
          console.error(`删除壁纸 ID ${id} 失败:`, error);
          failedIds.push(id);
        }
      }
    }

    return { deletedCount, failedIds };
  }

  /**
   * 增加查看次数
   */
  async incrementViewCount(id: number): Promise<void> {
    await this.wallpaperRepository.increment({ id }, "viewCount", 1);
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: number): Promise<void> {
    await this.wallpaperRepository.increment({ id }, "downloadCount", 1);
  }

  /**
   * 检查用户是否已点赞
   */
  async hasLiked(wallpaperId: number, userId: number): Promise<boolean> {
    const like = await this.userLikeRepository.findOne({
      where: { wallpaperId, userId },
    });
    return !!like;
  }

  /**
   * 切换点赞状态（使用事务防止竞态条件）
   */
  async toggleLike(userId: number, wallpaperId: number): Promise<{ isLiked: boolean }> {
    return await this.dataSource.transaction(async (manager) => {
      const userLikeRepo = manager.getRepository(UserLike);
      const wallpaperRepo = manager.getRepository(Wallpaper);

      const existingLike = await userLikeRepo.findOne({
        where: { userId, wallpaperId },
      });

      if (existingLike) {
        await userLikeRepo.delete({ id: existingLike.id });
        await wallpaperRepo.decrement({ id: wallpaperId }, "likeCount", 1);
        return { isLiked: false };
      } else {
        const userLike = userLikeRepo.create({ userId, wallpaperId });
        await userLikeRepo.save(userLike);
        await wallpaperRepo.increment({ id: wallpaperId }, "likeCount", 1);
        return { isLiked: true };
      }
    });
  }


  /**
   * 检查用户是否已收藏
   */
  async hasFavorited(wallpaperId: number, userId: number): Promise<boolean> {
    const favorite = await this.userFavoriteRepository.findOne({
      where: { wallpaperId, userId },
    });
    return !!favorite;
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

  /**
   * 切换收藏状态（使用事务防止竞态条件）
   */
  async toggleFavorite(userId: number, wallpaperId: number): Promise<{ isFavorited: boolean }> {
    return await this.dataSource.transaction(async (manager) => {
      const userFavoriteRepo = manager.getRepository(UserFavorite);
      const wallpaperRepo = manager.getRepository(Wallpaper);

      const existingFavorite = await userFavoriteRepo.findOne({
        where: { userId, wallpaperId },
      });

      if (existingFavorite) {
        await userFavoriteRepo.delete({ id: existingFavorite.id });
        await wallpaperRepo.decrement({ id: wallpaperId }, "favoriteCount", 1);
        return { isFavorited: false };
      } else {
        const userFavorite = userFavoriteRepo.create({ userId, wallpaperId });
        await userFavoriteRepo.save(userFavorite);
        await wallpaperRepo.increment({ id: wallpaperId }, "favoriteCount", 1);
        return { isFavorited: true };
      }
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

    const skip = (page - 1) * limit;

    const [data, total] = await this.wallpaperRepository.findAndCount({
      where: { uploaderId, status: 1 },
      relations: ["uploader", "tags"],
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return { data, total };
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
    const qb = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags");

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      qb.andWhere(
        '(wallpaper.title LIKE :search OR wallpaper.description LIKE :search OR tags.name LIKE :search)',
        { search: searchTerm },
      );
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

    return { data, total };
  }

  async batchSetFeatured(
    ids: number[],
    isFeatured: boolean,
  ): Promise<{ updatedCount: number; failedIds: number[] }> {
    let updatedCount = 0;
    const failedIds: number[] = [];

    for (const id of ids) {
      try {
        await this.wallpaperRepository.update(id, { isFeatured });
        updatedCount++;
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

    return qb.getMany();
  }

  /**
   * 获取热门壁纸
   * 按照浏览量降序排序
   */
  async getPopularWallpapers(limit: number = 10): Promise<Wallpaper[]> {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔥 [热门壁纸] 查询参数: limit=${limit}, 按综合评分降序排序`);
    }

    // 加权综合评分：浏览x1 + 点赞x5 + 收藏x8 + 下载x3
    const wallpapers = await this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .addSelect(
        WallpaperService.POPULARITY_SCORE,
        "popularity_score",
      )
      .where("wallpaper.status = :status", { status: 1 })
      .orderBy("popularity_score", "DESC")
      .take(limit)
      .getMany();

    if (process.env.NODE_ENV === "development") {
      console.log(`🔥 [热门壁纸] 查询结果数量: ${wallpapers.length}`);
      if (wallpapers.length > 0) {
        console.log(`🔥 [热门壁纸] 浏览量排序验证:`);
        wallpapers.forEach((wallpaper, index) => {
          console.log(
            `  ${index + 1}. ID:${wallpaper.id} 浏览量:${wallpaper.viewCount} 创建时间:${wallpaper.createdAt.toISOString()}`,
          );
        });
      }
    }

    return wallpapers;
  }

  /**
   * 获取近期热门壁纸（最近N天内按综合评分排序）
   */
  async getTrendingWallpapers(
    days: number = 7,
    limit: number = 10,
  ): Promise<Wallpaper[]> {
    const qb = this.wallpaperRepository
      .createQueryBuilder("wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .addSelect(
        WallpaperService.POPULARITY_SCORE,
        "popularity_score",
      )
      .where("wallpaper.status = :status", { status: 1 })
      .andWhere("wallpaper.createdAt >= :since", {
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      })
      .orderBy("popularity_score", "DESC")
      .take(limit);

    return qb.getMany();
  }

  /**
   * 获取用户点赞的壁纸列表（分页）
   */
  async getUserLikedWallpapers(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
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
    const wallpapers = likes.map((like) => like.wallpaper).filter(Boolean);

    return { data: wallpapers, total };
  }

  /**
   * 获取用户收藏的壁纸列表（分页）
   */
  async getUserFavoritedWallpapers(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Wallpaper[]; total: number }> {
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
    const wallpapers = favorites.map((favorite) => favorite.wallpaper).filter(Boolean);

    return { data: wallpapers, total };
  }
}
