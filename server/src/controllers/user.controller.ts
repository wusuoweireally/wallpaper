import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  Req,
  UnauthorizedException,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import { UserService } from "../services/user.service";
import { AuthService } from "../services/auth.service";
import { WallpaperService } from "../services/wallpaper.service";
import { ViewHistoryService } from "../services/view-history.service";
import { UploadService } from "../services/upload.service";
import {
  ChangePasswordDto,
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
} from "../dto/user.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/optional-jwt-auth.guard";
import { CurrentUser } from "../decorators/current-user.decorator";
import type { CurrentUserType } from "../decorators/current-user.decorator";
import { User } from "../entities/user.entity";
import { isAdminRole } from "../entities/user.entity";
import { getAuthCookieOptions } from "../utils/cookie";
import { resolveAvatarUrl } from "../utils/avatar";
import { getJwtCookieMaxAge } from "../utils/duration";
import { buildPaginationMeta } from "../common/pagination";

@Controller("users")
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly wallpaperService: WallpaperService,
    private readonly viewHistoryService: ViewHistoryService,
    private readonly uploadService: UploadService,
  ) {}

  // 用户注册（仅支持JSON格式，不支持头像上传）
  @Post("register")
  @Throttle({ default: { limit: 10, ttl: 300000 } })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.create(createUserDto);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    return {
      success: true,
      message: "注册成功",
      data: result,
    };
  }

  // 用户登录
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 900000 } })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.validateUser(
      loginDto.account,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException("用户名、邮箱或密码错误");
    }

    const result = this.authService.login(user);

    // 设置Cookie，有效期60天（与JWT token过期时间一致）
    response.cookie(
      "Authentication",
      result.access_token,
      getAuthCookieOptions(request, {
        maxAge: getJwtCookieMaxAge(),
      }),
    );

    return {
      success: true,
      message: "登录成功",
      data: {
        user: result.user,
      },
    };
  }

  // 用户退出登录
  // SameSite=Lax 挡不住跨站 POST 的 Set-Cookie 生效：来源不可信时跳过清 Cookie，
  // 响应体保持一致，不向攻击面泄露差异行为（恶意页面拿到 success 也踢不掉受害者）
  @Post("logout")
  @UseGuards(OptionalJwtAuthGuard)
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (this.isTrustedOrigin(request)) {
      response.clearCookie("Authentication", getAuthCookieOptions(request));
    }
    return {
      success: true,
      message: "退出登录成功",
    };
  }

  /**
   * 登出防 CSRF：Origin 白名单取 FRONTEND_URL 与 ALLOWED_FRONTEND_ORIGINS。
   * 两侧都经 new URL().origin 归一化比较（容忍尾斜杠/大小写手滑）；
   * 变量均未配置时按开发缺省 http://localhost:1234 放行（生产由 env.validation
   * 强制配置 FRONTEND_URL，该兜底不会在生产生效）。
   * 无 Origin 的同源/服务端调用放行；拒绝时留 warn 日志便于排查"退不出登录"。
   */
  private isTrustedOrigin(request: Request): boolean {
    const raw = request.headers["origin"];
    if (!raw || Array.isArray(raw)) return true;

    let requestOrigin: string;
    try {
      requestOrigin = new URL(raw).origin.toLowerCase();
    } catch {
      return false;
    }

    const allowed = new Set<string>();
    for (const item of [
      ...(process.env.ALLOWED_FRONTEND_ORIGINS ?? "").split(","),
      process.env.FRONTEND_URL ?? "",
    ]) {
      try {
        const parsed = new URL(item.trim());
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
          allowed.add(parsed.origin.toLowerCase());
        }
      } catch {
        // 非法条目忽略，其余条目继续生效
      }
    }
    if (allowed.size === 0) {
      allowed.add("http://localhost:1234");
    }

    if (!allowed.has(requestOrigin)) {
      this.logger.warn(`登出来源不在白名单，已跳过清除凭据: ${requestOrigin}`);
      return false;
    }
    return true;
  }

  // 获取当前用户信息
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() request: Request) {
    // 从JWT token中获取用户ID
    const userId = (request.user as { userId?: number })?.userId;

    // 验证用户ID的有效性
    if (!userId || isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException("用户未认证或认证信息无效");
    }

    const user = await this.userService.findById(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    // 头像：COS 完整 URL，否则用默认头像
    const avatarUrl = resolveAvatarUrl(result.avatarUrl);

    return {
      success: true,
      data: {
        ...result,
        avatarUrl,
      },
    };
  }

  // 用户管理列表走 /admin/users（admin-user.controller），此处不再重复提供 GET /users

  @Patch("password")
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body(ValidationPipe) dto: ChangePasswordDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    await this.userService.changePassword(currentUser.userId, dto);
    return {
      success: true,
      message: "密码修改成功",
    };
  }

  // 更新用户信息
  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  async update(
    @Param("id") id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException("用户ID无效");
    }

    // 仅允许本人或管理员修改
    if (currentUser.userId !== userId && !isAdminRole(currentUser.role)) {
      throw new ForbiddenException("无权修改该用户信息");
    }

    const user = await this.userService.update(
      userId,
      updateUserDto,
      currentUser,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return {
      success: true,
      message: "更新成功",
      data: result,
    };
  }

  // 删除用户
  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param("id") id: string,
    @CurrentUser() currentUser: CurrentUserType,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException("用户ID无效");
    }

    // 仅允许本人或管理员删除
    if (currentUser.userId !== userId && !isAdminRole(currentUser.role)) {
      throw new ForbiddenException("无权删除该用户");
    }

    await this.userService.remove(userId, currentUser);
    if (currentUser.userId === userId) {
      response.clearCookie("Authentication", getAuthCookieOptions(request));
    }
    return {
      success: true,
      message: "账号已注销，历史内容已匿名保留",
    };
  }

  // 禁用/启用用户统一走 PATCH /admin/users/:id/status 显式设值，不再提供翻转式端点

  // 上传头像
  @Post(":id/avatar")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 40, ttl: 3600000 } })
  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  async uploadAvatar(
    @Param("id") id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() currentUser: CurrentUserType,
  ) {
    // 转换并验证ID
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException("用户ID无效");
    }

    // 仅允许本人或管理员上传
    if (currentUser.userId !== userId && !isAdminRole(currentUser.role)) {
      throw new ForbiddenException("无权上传该用户头像");
    }

    if (!file) {
      throw new BadRequestException("请选择要上传的头像文件");
    }

    const previousAvatar = (await this.userService.findById(userId)).avatarUrl;
    const avatarUrl = await this.uploadService.processAvatarUpload(
      file,
      userId,
    );
    let updatedUser: User;

    try {
      updatedUser = await this.userService.updateAvatar(userId, avatarUrl);
    } catch (error) {
      await this.uploadService.deleteAvatar(avatarUrl);
      throw error;
    }

    await this.uploadService.deleteAvatar(previousAvatar);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = updatedUser;

    return {
      success: true,
      message: "头像上传成功",
      data: {
        avatarUrl,
        user: result,
      },
    };
  }

  /**
   * 获取用户收藏的壁纸列表
   */
  @Get("favorites")
  @UseGuards(JwtAuthGuard)
  async getUserFavorites(
    @CurrentUser() user: { userId: number; username: string },
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    const result = await this.wallpaperService.getUserFavoritedWallpapers(
      user.userId,
      Number(page),
      Number(limit),
    );

    return this.buildPaginatedResponse(result, Number(page), Number(limit));
  }

  /**
   * 获取用户浏览记录
   */
  @Get("view-history")
  @UseGuards(JwtAuthGuard)
  async getUserViewHistory(
    @CurrentUser() user: { userId: number; username: string },
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    const result = await this.viewHistoryService.getUserViewHistory(
      user.userId,
      Number(page),
      Number(limit),
    );

    return this.buildPaginatedResponse(result, Number(page), Number(limit));
  }
  /**
   * 获取当前用户上传的壁纸列表
   */
  @Get("wallpapers")
  @UseGuards(JwtAuthGuard)
  async getUserWallpapers(
    @CurrentUser() user: { userId: number; username: string },
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    const result = await this.wallpaperService.findOwnUploads(
      user.userId,
      Number(page),
      Number(limit),
    );

    return this.buildPaginatedResponse(result, Number(page), Number(limit));
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  async getUserStats(@CurrentUser() user: CurrentUserType) {
    const [uploadStats, favorites] = await Promise.all([
      this.wallpaperService.getUploaderStats(user.userId),
      this.wallpaperService.countUserFavorites(user.userId),
    ]);

    return {
      success: true,
      data: {
        ...uploadStats,
        favorites,
      },
    };
  }
  /**
   * 公开：用户已审核上传
   * 须放在 :id 之前（Nest 按声明顺序匹配，但带二级路径仍需独立声明）
   */
  @Get(":id/uploads")
  async getPublicUploads(
    @Param("id") id: string,
    @Query("page") page: string = "1",
    @Query("limit") limit: string = "20",
  ) {
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException("用户ID无效");
    }
    await this.userService.findById(userId);
    const result = await this.wallpaperService.findPublicUploadsByUser(
      userId,
      Number(page),
      Number(limit),
    );
    return this.buildPaginatedResponse(result, Number(page), Number(limit));
  }

  // 根据ID查询用户（公开可读基础字段；登录后本人/管理员可见更多）
  @Get(":id")
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param("id") id: string,
    @CurrentUser() currentUser?: CurrentUserType,
  ) {
    const userId = Number(id);
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException("用户ID无效");
    }

    const user = await this.userService.findById(userId);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;

    const canViewPrivate =
      !!currentUser &&
      (currentUser.userId === userId || isAdminRole(currentUser.role));

    if (!canViewPrivate) {
      return {
        success: true,
        data: {
          id: result.id,
          username: result.username,
          avatarUrl: result.avatarUrl,
          bio: result.bio,
          createdAt: result.createdAt,
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  }

  /** 构建统一分页响应：数据兜底后复用 buildPaginationMeta */
  private buildPaginatedResponse(
    result: { data: unknown[]; total: number },
    page: number,
    limit: number = 20,
  ) {
    const totalCount = typeof result.total === "number" ? result.total : 0;
    const safeData = Array.isArray(result.data) ? result.data : [];
    return {
      success: true,
      data: safeData,
      pagination: buildPaginationMeta({
        data: safeData,
        total: totalCount,
        page,
        limit,
      }),
    };
  }
}
