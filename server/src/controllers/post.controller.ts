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
  CreatePostDto,
  PostListQueryDto,
  UpdatePostDto,
} from "../dto/post.dto";
import { PaginationQueryDto } from "../dto/pagination.dto";
import { PostService } from "../services/post.service";

/**
 * 帖子控制器
 *
 * 异常处理由全局 HttpExceptionFilter 统一负责，
 * 控制器方法直接返回 {success, data, message} 即可。
 */
@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const post = await this.postService.create(createPostDto, user.userId);
    return { success: true, message: "帖子创建成功", data: post };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getPosts(@Query() query: PostListQueryDto, @Req() req: Request) {
    const user = req.user as CurrentUserType | undefined;
    const result = await this.postService.findAll(query, user?.userId);
    return {
      success: true,
      data: result.data,
      pagination: buildPaginationMeta(result),
    };
  }

  // 静态路径必须在 :id 之前，否则 popular/user 会被当成 id
  @Get("user/bookmarks")
  @UseGuards(JwtAuthGuard)
  async getMyBookmarks(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.postService.getUserBookmarks(
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

  @Get("popular/list")
  async getPopularPosts(@Query("limit") limit: number = 10) {
    const posts = await this.postService.getPopularPosts(limit);
    return { success: true, data: posts };
  }

  @Get("latest/list")
  async getLatestPosts(@Query("limit") limit: number = 10) {
    const posts = await this.postService.getLatestPosts(limit);
    return { success: true, data: posts };
  }

  @Get("user/my")
  @UseGuards(JwtAuthGuard)
  async getMyPosts(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.postService.getUserPosts(
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

  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async getPost(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const post = await this.postService.findById(id);
    const user = req.user as CurrentUserType | undefined;
    let isLiked = false;
    let isBookmarked = false;
    if (user?.userId) {
      [isLiked, isBookmarked] = await Promise.all([
        this.postService.hasLiked(id, user.userId),
        this.postService.hasBookmarked(id, user.userId),
      ]);
    }
    return { success: true, data: { ...post, isLiked, isBookmarked } };
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard)
  async updatePost(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const post = await this.postService.update(id, updatePostDto, user.userId);
    return { success: true, message: "帖子更新成功", data: post };
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async deletePost(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.postService.delete(id, user.userId);
    return { success: true, message: "帖子删除成功" };
  }

  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.postService.addLike(id, user.userId);
    return {
      success: true,
      message: "点赞成功",
      data: result,
    };
  }

  @Delete(":id/like")
  @UseGuards(JwtAuthGuard)
  async unlikePost(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.postService.removeLike(id, user.userId);
    return { success: true, message: "已取消点赞", data: result };
  }

  @Get(":id/like")
  @UseGuards(JwtAuthGuard)
  async checkLikeStatus(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const hasLiked = await this.postService.hasLiked(id, user.userId);
    return { success: true, data: { hasLiked } };
  }

  @Post(":id/share")
  async sharePost(@Param("id", ParseIntPipe) id: number) {
    await this.postService.incrementShareCount(id);
    return { success: true, message: "分享计数已更新" };
  }

  @Post(":id/bookmark")
  @UseGuards(JwtAuthGuard)
  async bookmarkPost(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.postService.bookmarkPost(id, user.userId);
    return { success: true, message: "收藏成功" };
  }

  @Delete(":id/bookmark")
  @UseGuards(JwtAuthGuard)
  async unbookmarkPost(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.postService.unbookmarkPost(id, user.userId);
    return { success: true, message: "取消收藏成功" };
  }

  @Get(":id/bookmark")
  @UseGuards(JwtAuthGuard)
  async checkBookmarkStatus(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const hasBookmarked = await this.postService.hasBookmarked(id, user.userId);
    return { success: true, data: { hasBookmarked } };
  }
}
