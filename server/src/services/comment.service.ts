import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Repository } from "typeorm";
import {
  normalizeLimit,
  normalizePagination,
  PaginatedResult,
} from "../common/pagination";
import { CommentQueryDto, CreateCommentDto } from "../dto/comment.dto";
import { Comment } from "../entities/comment.entity";
import { Post, PostStatus } from "../entities/post.entity";
import { CommentLike } from "../entities/comment-like.entity";

type CommentWithReplies = Comment & {
  replies: CommentWithReplies[];
  isLiked: boolean;
};

const MAX_COMMENT_DEPTH = 3;

/**
 * 评论服务
 *
 * 处理论坛评论的所有业务逻辑，包括：
 * - 评论的创建、查询、删除
 * - 帖子评论数的更新
 * - 评论的层级关系管理
 * - 用户评论权限控制
 */
@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(CommentLike)
    private readonly commentLikeRepository: Repository<CommentLike>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private createPublishedCommentQuery(
    repository: Repository<Comment> = this.commentRepository,
    includePost = false,
  ) {
    const query = repository.createQueryBuilder("comment");
    const parameters = { publishedStatus: PostStatus.PUBLISHED };
    return includePost
      ? query.innerJoinAndSelect(
          "comment.post",
          "post",
          "post.status = :publishedStatus",
          parameters,
        )
      : query.innerJoin(
          "comment.post",
          "post",
          "post.status = :publishedStatus",
          parameters,
        );
  }

  private async assertPublishedPost(postId: number): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { id: postId, status: PostStatus.PUBLISHED },
      select: { id: true },
    });
    if (!post) {
      throw new NotFoundException(`帖子 ID ${postId} 不存在或未发布`);
    }
  }

  /**
   * 创建新评论
   *
   * @param commentData 评论数据
   * @param authorId 作者ID
   * @returns 创建的评论
   */
  async create(
    commentData: CreateCommentDto,
    authorId: number,
  ): Promise<Comment> {
    const savedId = await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const postRepo = manager.getRepository(Post);

      const post = await postRepo
        .createQueryBuilder("post")
        .setLock("pessimistic_write")
        .where("post.id = :postId", { postId: commentData.postId })
        .andWhere("post.status = :status", { status: PostStatus.PUBLISHED })
        .getOne();
      if (!post) {
        throw new NotFoundException(
          `帖子 ID ${commentData.postId} 不存在或未发布`,
        );
      }

      if (commentData.parentId) {
        let depth = 1;
        let ancestorId: number | null = commentData.parentId;

        while (ancestorId) {
          const ancestor = await commentRepo.findOne({
            where: { id: ancestorId, deletedAt: IsNull() },
          });
          if (!ancestor) {
            throw new NotFoundException(`父评论 ID ${ancestorId} 不存在`);
          }
          if (ancestor.postId !== commentData.postId) {
            throw new ForbiddenException("父评论不属于指定帖子");
          }

          depth += 1;
          if (depth > MAX_COMMENT_DEPTH) {
            throw new BadRequestException("评论回复最多支持 3 层");
          }
          ancestorId = ancestor.parentId;
        }
      }

      const comment = commentRepo.create({
        content: commentData.content,
        parentId: commentData.parentId,
        postId: commentData.postId,
        authorId,
      });

      const savedComment = await commentRepo.save(comment);

      await postRepo.increment({ id: commentData.postId }, "commentCount", 1);
      await postRepo.update(commentData.postId, { lastCommentAt: new Date() });

      if (commentData.parentId) {
        await commentRepo.increment(
          { id: commentData.parentId },
          "replyCount",
          1,
        );
      }

      return savedComment.id;
    });

    return this.findById(savedId);
  }

  /**
   * 根据ID查找评论（包含作者信息）
   *
   * @param id 评论ID
   * @returns 评论信息
   */
  // 作者关联仅暴露公开字段，避免泄露 email/role/passwordHash 等敏感信息
  private static readonly AUTHOR_PUBLIC_FIELDS = [
    "author.id",
    "author.username",
    "author.avatarUrl",
  ];

  async findById(id: number): Promise<Comment> {
    const comment = await this.createPublishedCommentQuery()
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .where("comment.id = :id", { id })
      .getOne();

    if (!comment) {
      throw new NotFoundException(`评论 ID ${id} 不存在`);
    }

    return comment;
  }

  /**
   * 获取帖子的评论列表（支持分页和层级显示）
   *
   * @param postId 帖子ID
   * @param params 查询参数
   * @returns 分页结果
   */
  async findByPostId(
    postId: number,
    params: CommentQueryDto,
    userId?: number,
  ): Promise<PaginatedResult<CommentWithReplies>> {
    const {
      page: requestedPage = 1,
      limit: requestedLimit = 20,
      sortBy = "createdAt",
      sortOrder = "ASC", // 评论默认按时间升序排列
      parentId,
    } = params;

    const { page, limit } = normalizePagination(requestedPage, requestedLimit);
    const skip = (page - 1) * limit;
    await this.assertPublishedPost(postId);

    // 构建查询条件
    const queryBuilder = this.createPublishedCommentQuery().where(
      "comment.postId = :postId",
      { postId },
    );

    // 如果指定了父评论ID，获取该评论的子评论
    if (parentId !== undefined) {
      queryBuilder.andWhere("comment.parentId = :parentId", { parentId });
    } else {
      // 否则获取顶级评论
      queryBuilder.andWhere("comment.parentId IS NULL");
    }

    // 添加作者信息关联（仅公开字段）
    queryBuilder
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS);

    // 处理排序
    const validSortFields = ["createdAt", "updatedAt", "likeCount"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    queryBuilder.orderBy(`comment.${sortField}`, sortOrder);

    // 执行分页查询
    const [comments, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = await this.attachReplies(postId, comments, userId);
    return { data, total, page, limit };
  }

  private async attachReplies(
    postId: number,
    roots: Comment[],
    userId?: number,
  ): Promise<CommentWithReplies[]> {
    const allComments = new Map<number, CommentWithReplies>();
    const byParent = new Map<number, CommentWithReplies[]>();
    const rootComments = roots.map((comment) => {
      const node = Object.assign(comment, {
        replies: [] as CommentWithReplies[],
        isLiked: false,
      });
      allComments.set(comment.id, node);
      return node;
    });

    let parentIds = rootComments.map((comment) => comment.id);
    for (
      let depth = 1;
      depth <= MAX_COMMENT_DEPTH && parentIds.length > 0;
      depth += 1
    ) {
      const replies = await this.createPublishedCommentQuery()
        .leftJoin("comment.author", "author")
        .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
        .where("comment.postId = :postId", { postId })
        .andWhere("comment.parentId IN (:...parentIds)", { parentIds })
        .orderBy("comment.createdAt", "ASC")
        .getMany();

      parentIds = [];
      for (const reply of replies) {
        if (allComments.has(reply.id)) continue;
        const node = Object.assign(reply, {
          replies: [] as CommentWithReplies[],
          isLiked: false,
        });
        allComments.set(reply.id, node);
        const siblings = byParent.get(reply.parentId) ?? [];
        siblings.push(node);
        byParent.set(reply.parentId, siblings);
        parentIds.push(reply.id);
      }
    }

    for (const [parentId, replies] of byParent) {
      const parent = allComments.get(parentId);
      if (parent) parent.replies = replies;
    }

    if (userId && allComments.size > 0) {
      const likes = await this.commentLikeRepository.find({
        where: { userId, commentId: In([...allComments.keys()]) },
        select: { commentId: true },
      });
      for (const like of likes) {
        const comment = allComments.get(like.commentId);
        if (comment) comment.isLiked = true;
      }
    }

    return rootComments;
  }

  /**
   * 获取评论的所有子评论
   *
   * @param parentCommentId 父评论ID
   * @returns 子评论列表
   */
  async getChildComments(parentCommentId: number): Promise<Comment[]> {
    return await this.createPublishedCommentQuery()
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .where("comment.parentId = :parentCommentId", { parentCommentId })
      .orderBy("comment.createdAt", "ASC")
      .getMany();
  }

  /**
   * 删除评论（事务保护：删除评论 + 递归删子评论 + 更新所有计数器 原子执行）
   *
   * @param id 评论ID
   * @param userId 当前用户ID
   */
  async delete(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${id} 不存在`);
    }

    if (comment.authorId != userId) {
      throw new ForbiddenException("只能删除自己的评论");
    }

    await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const postRepo = manager.getRepository(Post);

      const post = await postRepo
        .createQueryBuilder("post")
        .setLock("pessimistic_write")
        .where("post.id = :postId", { postId: comment.postId })
        .getOne();
      if (!post) {
        throw new NotFoundException(`帖子 ID ${comment.postId} 不存在`);
      }

      const subtreeIds = await this.getCommentSubtreeIds(id, manager);

      const result = await commentRepo.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`评论 ID ${id} 删除失败`);
      }

      if (comment.parentId) {
        await commentRepo
          .createQueryBuilder()
          .update(Comment)
          .set({ replyCount: () => "GREATEST(reply_count - 1, 0)" })
          .where("id = :parentId", { parentId: comment.parentId })
          .execute();
      }

      await manager.query(
        `UPDATE posts
         SET comment_count = GREATEST(comment_count - ?, 0),
             last_comment_at = (
               SELECT MAX(created_at) FROM comments
               WHERE post_id = ? AND deleted_at IS NULL
             )
         WHERE id = ?`,
        [subtreeIds.length, comment.postId, comment.postId],
      );
    });
  }

  private async getCommentSubtreeIds(
    rootId: number,
    manager: import("typeorm").EntityManager,
  ): Promise<number[]> {
    const ids = [rootId];
    let parentIds = [rootId];

    while (parentIds.length > 0) {
      const children = await manager.getRepository(Comment).find({
        where: { parentId: In(parentIds) },
        select: { id: true },
      });
      parentIds = children.map((child) => child.id);
      ids.push(...parentIds);
    }

    return ids;
  }

  /**
   * 更新评论内容
   *
   * @param id 评论ID
   * @param content 新内容
   * @param userId 当前用户ID
   * @returns 更新后的评论
   */
  async update(id: number, content: string, userId: number): Promise<Comment> {
    const comment = await this.createPublishedCommentQuery()
      .where("comment.id = :id", { id })
      .getOne();

    if (!comment) {
      throw new NotFoundException(`评论 ID ${id} 不存在`);
    }

    if (comment.authorId != userId) {
      throw new ForbiddenException("只能编辑自己的评论");
    }

    await this.commentRepository.update(id, { content });
    return await this.findById(id);
  }

  /**
   * 获取用户发布的评论
   *
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserComments(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Comment>> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const [comments, total] = await this.createPublishedCommentQuery(
      this.commentRepository,
      true,
    )
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .where("comment.authorId = :userId", { userId })
      .orderBy("comment.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: comments, total, page, limit };
  }

  /**
   * 获取帖子的评论总数统计
   *
   * @param postId 帖子ID
   * @returns 评论统计信息
   */
  async getCommentStats(postId: number): Promise<{
    totalComments: number;
    topLevelComments: number;
  }> {
    await this.assertPublishedPost(postId);
    const query = this.createPublishedCommentQuery().where(
      "comment.postId = :postId",
      { postId },
    );
    const [totalComments, topLevelComments] = await Promise.all([
      query.clone().getCount(),
      query.clone().andWhere("comment.parentId IS NULL").getCount(),
    ]);

    return {
      totalComments,
      topLevelComments,
    };
  }

  /**
   * 获取最新评论
   *
   * @param limit 限制数量
   * @returns 最新评论列表
   */
  async getLatestComments(limit: number = 10): Promise<Comment[]> {
    limit = normalizeLimit(limit, 10, 50);
    return await this.createPublishedCommentQuery(this.commentRepository, true)
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .orderBy("comment.createdAt", "DESC")
      .take(limit)
      .getMany();
  }

  /**
   * 点赞评论
   *
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 点赞结果和当前点赞状态
   */
  async likeComment(
    commentId: number,
    userId: number,
  ): Promise<{
    isLiked: boolean;
    likeCount: number;
  }> {
    return await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const likeRepo = manager.getRepository(CommentLike);

      const comment = await this.createPublishedCommentQuery(commentRepo)
        .setLock("pessimistic_write")
        .where("comment.id = :commentId", { commentId })
        .getOne();
      if (!comment) {
        throw new NotFoundException(`评论 ID ${commentId} 不存在`);
      }

      const existingLike = await likeRepo.findOne({
        where: { commentId, userId },
      });

      if (existingLike) {
        const result = await likeRepo.delete(existingLike.id);
        if (result.affected) {
          await commentRepo
            .createQueryBuilder()
            .update(Comment)
            .set({ likeCount: () => "GREATEST(like_count - 1, 0)" })
            .where("id = :commentId", { commentId })
            .execute();
        }

        const updatedComment = await commentRepo.findOne({
          where: { id: commentId },
        });

        return {
          isLiked: false,
          likeCount: updatedComment?.likeCount || 0,
        };
      }

      const like = likeRepo.create({ commentId, userId });
      await likeRepo.save(like);
      await commentRepo.increment({ id: commentId }, "likeCount", 1);

      const updatedComment = await commentRepo.findOne({
        where: { id: commentId },
      });

      return {
        isLiked: true,
        likeCount: updatedComment?.likeCount || 0,
      };
    });
  }

  /**
   * 检查用户是否对评论点赞
   *
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 是否点赞
   */
  async isCommentLikedByUser(
    commentId: number,
    userId: number,
  ): Promise<boolean> {
    const result = await this.commentLikeRepository
      .createQueryBuilder("like")
      .innerJoin("like.comment", "comment")
      .innerJoin("comment.post", "post", "post.status = :publishedStatus", {
        publishedStatus: PostStatus.PUBLISHED,
      })
      .where("like.commentId = :commentId", { commentId })
      .andWhere("like.userId = :userId", { userId })
      .getExists();
    return result;
  }

  /**
   * 获取用户点赞的评论列表
   *
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserLikedComments(
    userId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Comment>> {
    ({ page, limit } = normalizePagination(page, limit));
    const skip = (page - 1) * limit;

    const [commentLikes, total] = await this.commentLikeRepository
      .createQueryBuilder("like")
      .leftJoinAndSelect("like.comment", "comment")
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .innerJoinAndSelect(
        "comment.post",
        "post",
        "post.status = :publishedStatus",
        { publishedStatus: PostStatus.PUBLISHED },
      )
      .where("like.userId = :userId", { userId })
      .orderBy("like.createdAt", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const comments = commentLikes.map((like) => like.comment);

    return { data: comments, total, page, limit };
  }

  /**
   * 获取评论点赞统计
   *
   * @param commentId 评论ID
   * @returns 点赞统计信息
   */
  async getCommentLikeStats(commentId: number): Promise<{
    likeCount: number;
    isLikedByCurrentUser?: boolean;
  }> {
    // 获取评论点赞数
    const comment = await this.createPublishedCommentQuery()
      .where("comment.id = :commentId", { commentId })
      .getOne();

    if (!comment) {
      throw new NotFoundException(`评论 ID ${commentId} 不存在`);
    }

    return {
      likeCount: comment.likeCount,
    };
  }
}
