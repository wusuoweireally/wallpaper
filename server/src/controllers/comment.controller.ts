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
import { CommentService } from "../services/comment.service";

/**
 * 评论控制器
 *
 * 异常处理由全局 HttpExceptionFilter 统一负责。
 * 仅保留前端实际调用的端点；列表/状态查询能力已内联在帖子详情与点赞响应里。
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

  // 静态路径必须在 :id 之前
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

  /** 点赞切换：isLiked 与 likeCount 随响应返回，无需独立的状态查询接口 */
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
}
