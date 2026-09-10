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
import { displayedViewCount } from "../common/view-count";
import { getClientIp } from "../utils/client-ip";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import {
  CreatePostDto,
  PostListQueryDto,
  UpdatePostDto,
} from "../dto/post.dto";
import { PostService } from "../services/post.service";
import { ViewHistoryService } from "../services/view-history.service";

/**
 * 帖子控制器
 *
 * 异常处理由全局 HttpExceptionFilter 统一负责，
 * 控制器方法直接返回 {success, data, message} 即可。
 * 仅保留前端实际调用的端点；详情的 isLiked/isBookmarked 随 GET /posts/:id 一次返回。
 */
@Controller("posts")
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly viewHistoryService: ViewHistoryService,
  ) {}

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

  /**
   * 帖子详情
   * 浏览计数与壁纸同口径：登录按用户+帖子 1 小时去重，游客按 IP+帖子去重，
   * 服务端权威判定——viewCount 是 popular 排序的输入，不防匿名刷榜会被顶上去
   */
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async getPost(@Param("id", ParseIntPipe) id: number, @Req() req: Request) {
    const user = req.user as CurrentUserType | undefined;
    // 计数在下方去重判定通过后手动累加，取详情本身不自动计数
    const post = await this.postService.findById(id, false);

    let isLiked = false;
    let isBookmarked = false;
    let counted = false;

    if (user?.userId) {
      const [liked, bookmarked, viewCounted] = await Promise.all([
        this.postService.hasLiked(id, user.userId),
        this.postService.hasBookmarked(id, user.userId),
        this.viewHistoryService.recordPostView(user.userId, id),
      ]);
      isLiked = liked;
      isBookmarked = bookmarked;
      counted = viewCounted;
    } else if (
      this.viewHistoryService.recordGuestView(getClientIp(req), id, "post")
    ) {
      await this.postService.incrementViewCount(id);
      counted = true;
    }

    return {
      success: true,
      data: {
        ...post,
        viewCount: displayedViewCount(post.viewCount, counted),
        isLiked,
        isBookmarked,
      },
    };
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

  /** 点赞切换：isLiked 与 likeCount 随响应返回，无需独立的状态查询接口 */
  @Post(":id/like")
  @UseGuards(JwtAuthGuard)
  async likePost(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserType,
  ) {
    const result = await this.postService.addLike(id, user.userId);
    return {
      success: true,
      message: result.isLiked ? "点赞成功" : "已取消点赞",
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

  /**
   * 分享计数：需登录。游客仍可正常分享（前端 navigator.share / 微博跳转不依赖本接口），
   * 只是不计入 shareCount——否则匿名可无限刷高这个展示值。
   */
  @Post(":id/share")
  @UseGuards(JwtAuthGuard)
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
}
