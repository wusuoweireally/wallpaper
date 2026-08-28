import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository, SelectQueryBuilder } from "typeorm";
import { PaginatedResult } from "../common/pagination";
import {
  CreatePostDto,
  PostListQueryDto,
  UpdatePostDto,
} from "../dto/post.dto";
import { Post, PostStatus } from "../entities/post.entity";
import { PostLike } from "../entities/post-like.entity";
import { PostBookmark } from "../entities/post-bookmark.entity";
import { sanitizeUser } from "../utils/sanitize";
import { normalizePagination } from "../common/pagination";
import { applyReaction } from "../common/reaction";

/**
 * 帖子服务
 *
 * 处理论坛帖子的所有业务逻辑，包括：
 * - 帖子的创建、查询、更新、删除
 * - 帖子统计数据的更新
 * - 用户点赞功能
 * - 帖子搜索和分页
 */
@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(PostLike)
    private readonly postLikeRepository: Repository<PostLike>,
    @InjectRepository(PostBookmark)
    private readonly postBookmarkRepository: Repository<PostBookmark>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private buildPublishedPostQuery(): SelectQueryBuilder<Post> {
    return this.postRepository
      .createQueryBuilder("post")
      .where("post.status = :status", { status: PostStatus.PUBLISHED })
      .leftJoinAndSelect("post.author", "author");
  }

  private sanitizePostAuthor(post: Post): Post {
    if (!post.author) return post;

    return {
      ...post,
      author: sanitizeUser(
        post.author as unknown as Record<string, unknown>,
      ) as unknown as Post["author"],
    };
  }

  private sanitizePostAuthors(posts: Post[]): Post[] {
    return posts.map((post) => this.sanitizePostAuthor(post));
  }

  private async assertPublishedPost(postId: number): Promise<void> {
    const exists = await this.postRepository.exists({
      where: { id: postId, status: PostStatus.PUBLISHED },
    });

    if (!exists) {
      throw new NotFoundException(`帖子 ID ${postId} 不存在或未发布`);
    }
  }

  private async attachLikeStatus(
    posts: Post[],
    userId?: number,
  ): Promise<Array<Post & { isLiked: boolean }>> {
    const sanitizedPosts = this.sanitizePostAuthors(posts);
    if (!userId || posts.length === 0) {
      return sanitizedPosts.map((post) => ({ ...post, isLiked: false }));
    }

    const likes = await this.postLikeRepository.find({
      where: { userId, postId: In(posts.map((post) => post.id)) },
      select: { postId: true },
    });
    const likedPostIds = new Set(likes.map((like) => like.postId));
    return sanitizedPosts.map((post) => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));
  }

  private serializeTags(tags?: string[]): string | null {
    if (!tags || tags.length === 0) {
      return null;
    }

    const normalized = tags.map((tag) => tag.trim()).filter(Boolean);

    return normalized.length > 0 ? normalized.join(",") : null;
  }

  /**
   * 创建新帖子
   *
   * @param postData 帖子数据
   * @param authorId 作者ID
   * @returns 创建的帖子
   */
  async create(postData: CreatePostDto, authorId: number): Promise<Post> {
    const { tags, ...rest } = postData;

    const post = this.postRepository.create({
      ...rest,
      tags: this.serializeTags(tags),
      authorId,
      status: PostStatus.PUBLISHED, // 默认发布状态
    });

    return await this.postRepository.save(post);
  }

  /**
   * 根据ID查找帖子（包含作者信息）
   *
   * @param id 帖子ID
   * @param incrementView 是否增加浏览量
   * @returns 帖子信息
   */
  async findById(id: number, incrementView = true): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, status: PostStatus.PUBLISHED },
      relations: ["author"],
    });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在或未发布`);
    }

    // 增加浏览量
    if (incrementView) {
      await this.incrementViewCount(id);
    }

    return this.sanitizePostAuthor(post);
  }

  /**
   * 分页查询帖子列表（支持搜索和多种筛选）
   *
   * @param params 查询参数
   * @returns 分页结果
   */
  async findAll(
    params: PostListQueryDto,
    userId?: number,
  ): Promise<PaginatedResult<Post & { isLiked: boolean }>> {
    const {
      page: requestedPage = 1,
      limit: requestedLimit = 20,
      sortBy = "createdAt",
      sortOrder = "DESC",
      category,
      search,
      authorId,
      tags,
    } = params;

    const { page, limit } = normalizePagination(requestedPage, requestedLimit);
    const skip = (page - 1) * limit;
    const tagsFilter = tags ?? [];

    // 构建查询条件
    const queryBuilder = this.buildPublishedPostQuery();

    // 添加搜索条件
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      queryBuilder.andWhere(
        "(post.title LIKE :search OR post.content LIKE :search OR post.summary LIKE :search)",
        { search: searchTerm },
      );
    }

    // 添加分类筛选
    if (category) {
      queryBuilder.andWhere("post.category = :category", { category });
    }

    // 添加作者筛选
    if (authorId) {
      queryBuilder.andWhere("post.authorId = :authorId", { authorId });
    }

    // 添加标签筛选
    if (tagsFilter.length > 0) {
      tagsFilter.forEach((tag, index) => {
        const paramName = `tag${index}`;
        queryBuilder.andWhere(
          `post.tags IS NOT NULL AND FIND_IN_SET(:${paramName}, post.tags) > 0`,
        );
        queryBuilder.setParameter(paramName, tag);
      });
    }

    // 处理排序逻辑
    const validSortFields = [
      "createdAt",
      "updatedAt",
      "viewCount",
      "likeCount",
      "commentCount",
      "popular",
    ];

    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    if (sortField === "popular") {
      queryBuilder
        .orderBy("post.viewCount", "DESC")
        .addOrderBy("post.likeCount", "DESC")
        .addOrderBy("post.id", "DESC"); // 平票次序键：同分页稳定不重复/漏页
    } else {
      queryBuilder.orderBy(`post.${sortField}`, sortOrder).addOrderBy("post.id", sortOrder);
    }

    // 执行分页查询
    const [posts, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: await this.attachLikeStatus(posts, userId),
      total,
      page,
      limit,
    };
  }

  /**
   * 更新帖子信息
   *
   * @param id 帖子ID
   * @param updateData 更新数据
   * @param userId 当前用户ID
   * @returns 更新后的帖子
   */
  async update(
    id: number,
    updateData: UpdatePostDto,
    userId: number,
  ): Promise<Post> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("只能编辑自己的帖子");
    }

    const { tags, ...rest } = updateData;

    await this.postRepository.update(id, {
      ...rest,
      ...(tags !== undefined ? { tags: this.serializeTags(tags) } : {}),
    });
    return await this.findById(id, false);
  }

  /**
   * 删除帖子
   *
   * @param id 帖子ID
   * @param userId 当前用户ID
   */
  async delete(id: number, userId: number): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${id} 不存在`);
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("只能删除自己的帖子");
    }

    const result = await this.postRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`帖子 ID ${id} 删除失败`);
    }
  }

  /**
   * 增加浏览次数
   *
   * @param id 帖子ID
   */
  async incrementViewCount(id: number): Promise<void> {
    // 原生 SQL 热计数：updated_at 赋自身值以抑制列上 ON UPDATE CURRENT_TIMESTAMP，
    // 避免每次浏览刷新 updated_at 导致列表/详情缓存参数失效
    await this.dataSource.query(
      "UPDATE posts SET view_count = view_count + 1, updated_at = updated_at WHERE id = ?",
      [id],
    );
  }

  /**
   * 增加分享次数
   *
   * @param id 帖子ID
   */
  async incrementShareCount(id: number): Promise<void> {
    const result = await this.postRepository.increment(
      { id, status: PostStatus.PUBLISHED },
      "shareCount",
      1,
    );
    if (result.affected === 0) {
      throw new NotFoundException(`帖子 ID ${id} 不存在或未发布`);
    }
  }

  /**
   * 检查用户是否已点赞
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   * @returns 是否已点赞
   */
  async hasLiked(postId: number, userId: number): Promise<boolean> {
    await this.assertPublishedPost(postId);
    const like = await this.postLikeRepository.findOne({
      where: { postId, userId },
    });
    return !!like;
  }

  /** 确保点赞存在（幂等 force-like），返回数据库最终状态。 */
  async addLike(
    postId: number,
    userId: number,
  ): Promise<{ isLiked: true; likeCount: number }> {
    return await this.dataSource.transaction(async (manager) => {
      const { count } = await applyReaction(manager, {
        parentEntity: Post,
        parentWhere: { id: postId, status: PostStatus.PUBLISHED },
        relationEntity: PostLike,
        relationWhere: { postId, userId },
        countField: "likeCount",
        countColumn: "like_count",
        notFoundMessage: `帖子 ID ${postId} 不存在或未发布`,
        mode: "add",
      });
      return { isLiked: true, likeCount: count };
    });
  }

  /**
   * 强制取消点赞（幂等）
   */
  async removeLike(
    postId: number,
    userId: number,
  ): Promise<{ isLiked: false; likeCount: number }> {
    return this.dataSource.transaction(async (manager) => {
      const { count } = await applyReaction(manager, {
        parentEntity: Post,
        parentWhere: { id: postId },
        relationEntity: PostLike,
        relationWhere: { postId, userId },
        countField: "likeCount",
        countColumn: "like_count",
        notFoundMessage: `帖子 ID ${postId} 不存在或未发布`,
        mode: "remove",
      });
      return { isLiked: false, likeCount: count };
    });
  }

  /**
   * 收藏帖子
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   */
  async bookmarkPost(postId: number, userId: number): Promise<void> {
    await this.assertPublishedPost(postId);
    await this.postBookmarkRepository
      .createQueryBuilder()
      .insert()
      .into(PostBookmark)
      .values({ postId, userId })
      .orIgnore()
      .execute();
  }

  /**
   * 取消收藏帖子
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   */
  async unbookmarkPost(postId: number, userId: number): Promise<void> {
    await this.postBookmarkRepository.delete({ postId, userId });
  }

  /**
   * 检查用户是否已收藏
   *
   * @param postId 帖子ID
   * @param userId 用户ID
   * @returns 是否已收藏
   */
  async hasBookmarked(postId: number, userId: number): Promise<boolean> {
    await this.assertPublishedPost(postId);
    const bookmark = await this.postBookmarkRepository.findOne({
      where: { postId, userId },
    });
    return !!bookmark;
  }
}
