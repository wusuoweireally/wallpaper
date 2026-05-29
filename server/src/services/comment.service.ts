import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository, InjectDataSource } from "@nestjs/typeorm";
import { DataSource, IsNull, Repository } from "typeorm";
import { PaginatedResult } from "../common/pagination";
import { CommentQueryDto, CreateCommentDto } from "../dto/comment.dto";
import { Comment } from "../entities/comment.entity";
import { Post } from "../entities/post.entity";
import { CommentLike } from "../entities/comment-like.entity";

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
    // 验证帖子是否存在（事务前校验，只读）
    const post = await this.postRepository.findOne({
      where: { id: commentData.postId },
    });

    if (!post) {
      throw new NotFoundException(`帖子 ID ${commentData.postId} 不存在`);
    }

    // 如果是回复评论，验证父评论是否存在
    if (commentData.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: commentData.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(`父评论 ID ${commentData.parentId} 不存在`);
      }

      if (parentComment.postId != commentData.postId) {
        throw new ForbiddenException("父评论不属于指定帖子");
      }
    }

    // 事务内：创建评论 + 更新计数，保证原子性
    const savedId = await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const postRepo = manager.getRepository(Post);

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
        await commentRepo.increment({ id: commentData.parentId }, "replyCount", 1);
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
    const comment = await this.commentRepository
      .createQueryBuilder("comment")
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
  ): Promise<PaginatedResult<Comment>> {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "ASC", // 评论默认按时间升序排列
      parentId,
    } = params;

    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryBuilder = this.commentRepository
      .createQueryBuilder("comment")
      .where("comment.postId = :postId", { postId });

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

    return { data: comments, total, page, limit };
  }

  /**
   * 获取评论的所有子评论
   *
   * @param parentCommentId 父评论ID
   * @returns 子评论列表
   */
  async getChildComments(parentCommentId: number): Promise<Comment[]> {
    return await this.commentRepository
      .createQueryBuilder("comment")
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

      // 递归删除子评论（使用事务 manager）
      await this.deleteChildCommentsWithManager(id, manager);

      const result = await commentRepo.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`评论 ID ${id} 删除失败`);
      }

      await postRepo.decrement({ id: comment.postId }, "commentCount", 1);

      if (comment.parentId) {
        await commentRepo.decrement({ id: comment.parentId }, "replyCount", 1);
      }
    });
  }

  /**
   * 递归删除子评论（事务内，使用传入的 EntityManager）
   */
  private async deleteChildCommentsWithManager(
    parentCommentId: number,
    manager: import("typeorm").EntityManager,
  ): Promise<void> {
    const commentRepo = manager.getRepository(Comment);
    const postRepo = manager.getRepository(Post);

    const childComments = await commentRepo.find({
      where: { parentId: parentCommentId },
    });

    for (const child of childComments) {
      await this.deleteChildCommentsWithManager(child.id, manager);
      await commentRepo.delete(child.id);
      await postRepo.decrement({ id: child.postId }, "commentCount", 1);
    }
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
    const comment = await this.commentRepository.findOne({ where: { id } });

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
    const skip = (page - 1) * limit;

    const [comments, total] = await this.commentRepository
      .createQueryBuilder("comment")
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .leftJoinAndSelect("comment.post", "post")
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
    // 获取总评论数
    const totalComments = await this.commentRepository.count({
      where: { postId },
    });

    // 获取顶级评论数
    const topLevelComments = await this.commentRepository.count({
      where: { postId, parentId: IsNull() },
    });

    return {
      totalComments,
      topLevelComments,
    };
  }

  /**
   * 检查评论是否存在
   *
   * @param id 评论ID
   * @returns 是否存在
   */
  async exists(id: number): Promise<boolean> {
    const count = await this.commentRepository.count({ where: { id } });
    return count > 0;
  }

  /**
   * 获取最新评论
   *
   * @param limit 限制数量
   * @returns 最新评论列表
   */
  async getLatestComments(limit: number = 10): Promise<Comment[]> {
    return await this.commentRepository
      .createQueryBuilder("comment")
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .leftJoinAndSelect("comment.post", "post")
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
    // 验证评论是否存在（事务前只读校验）
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${commentId} 不存在`);
    }

    // 事务内：查询 + 写入 原子执行，避免竞态
    return await this.dataSource.transaction(async (manager) => {
      const commentRepo = manager.getRepository(Comment);
      const likeRepo = manager.getRepository(CommentLike);

      const existingLike = await likeRepo.findOne({
        where: { commentId, userId },
      });

      if (existingLike) {
        // 已点赞 → 取消点赞
        await likeRepo.delete(existingLike.id);
        await commentRepo.decrement({ id: commentId }, "likeCount", 1);

        const updatedComment = await commentRepo.findOne({
          where: { id: commentId },
        });

        return {
          isLiked: false,
          likeCount: updatedComment?.likeCount || 0,
        };
      }

      // 未点赞 → 点赞（事务串行化隔离已防重复插入，兜底捕获 ER_DUP_ENTRY）
      try {
        const like = likeRepo.create({ commentId, userId });
        await likeRepo.save(like);
      } catch (error: any) {
        if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
          const updatedComment = await commentRepo.findOne({
            where: { id: commentId },
          });
          return {
            isLiked: true,
            likeCount: updatedComment?.likeCount || 0,
          };
        }
        throw error;
      }

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
    const like = await this.commentLikeRepository.findOne({
      where: { commentId, userId },
    });
    return !!like;
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
    const skip = (page - 1) * limit;

    const [commentLikes, total] = await this.commentLikeRepository
      .createQueryBuilder("like")
      .leftJoinAndSelect("like.comment", "comment")
      .leftJoin("comment.author", "author")
      .addSelect(CommentService.AUTHOR_PUBLIC_FIELDS)
      .leftJoinAndSelect("comment.post", "post")
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
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException(`评论 ID ${commentId} 不存在`);
    }

    return {
      likeCount: comment.likeCount,
    };
  }
}
