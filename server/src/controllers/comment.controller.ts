import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { buildPaginationMeta } from "../common/pagination";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import {
  CommentQueryDto,
  CreateCommentDto,
  UpdateCommentDto,
} from "../dto/comment.dto";
import { PaginationQueryDto } from "../dto/pagination.dto";
import { CommentService } from "../services/comment.service";

/**
 * 评论控制器
 *
 * 异常处理由全局 HttpExceptionFilter 统一负责。
 */
@Controller("comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const comment = await this.commentService.create(
      createCommentDto,
      user.userId,
    );
    return { success: true, message: "评论创建成功", data: comment };
  }

  @Get(":id")
  async getComment(@Param("id", ParseIntPipe) id: number) {
    const comment = await this.commentService.findById(id);
    return { success: true, data: comment };
  }

  @Get("post/:postId")
  @UseGuards(OptionalJwtAuthGuard)
  async getPostComments(
    @Param("postId", ParseIntPipe) postId: number,
    @Query() query: CommentQueryDto,
    @Req() req: Request,
  ) {
    const user = req.user as CurrentUserType | undefined;
    const result = await this.commentService.findByPostId(
      postId,
      query,
      user?.userId,
    );
    return {
      success: true,
      data: result.data,
      pagination: buildPaginationMeta(result),
    };
  }

  @Get(":parentCommentId/replies")
  async getCommentReplies(
    @Param("parentCommentId", ParseIntPipe) parentCommentId: number,
  ) {
    const replies = await this.commentService.getChildComments(parentCommentId);
    return { success: true, data: replies };
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async updateComment(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const comment = await this.commentService.update(
      id,
      updateCommentDto.content,
      user.userId,
    );
    return { success: true, message: "评论更新成功", data: comment };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.commentService.delete(id, user.userId);
    return { success: true, message: "评论删除成功" };
  }

  @Get("stats/:postId")
  async getCommentStats(@Param("postId", ParseIntPipe) postId: number) {
    const stats = await this.commentService.getCommentStats(postId);
    return { success: true, data: stats };
  }

  @Get("user/my")
  @UseGuards(JwtAuthGuard)
  async getMyComments(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.commentService.getUserComments(
      user.userId,
      query.page,
      query.limit,
    );
    return {
      success: true,
      data: result.data,
      pagination: buildPaginationMeta(result),
    };
  }

  @Get("latest/list")
  async getLatestComments(@Query("limit") limit: number = 10) {
    const comments = await this.commentService.getLatestComments(limit);
    return { success: true, data: comments };
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async toggleCommentLike(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.commentService.likeComment(id, user.userId);
    return {
      success: true,
      message: result.isLiked ? "评论点赞成功" : "取消点赞成功",
      data: result,
    };
  }

  @Get(":id/like-status")
  @UseGuards(JwtAuthGuard)
  async getCommentLikeStatus(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const isLiked = await this.commentService.isCommentLikedByUser(
      id,
      user.userId,
    );
    const stats = await this.commentService.getCommentLikeStats(id);
    return { success: true, data: { isLiked, likeCount: stats.likeCount } };
  }

  @Get("user/liked")
  @UseGuards(JwtAuthGuard)
  async getMyLikedComments(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.commentService.getUserLikedComments(
      user.userId,
      query.page,
      query.limit,
    );
    return {
      success: true,
      data: result.data,
      pagination: buildPaginationMeta(result),
    };
  }
}
