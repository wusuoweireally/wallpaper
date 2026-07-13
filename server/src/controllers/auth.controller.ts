import {
  Controller,
  Get,
  Req,
  Res,
  HttpException,
  HttpStatus,
  UseGuards,
  ConflictException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { GitHubAuthService } from "../services/github-auth.service";
import { AuthService } from "../services/auth.service";
import { GitHubProfile } from "../dto/github.dto";
import { getAuthCookieOptions } from "../utils/cookie";
import { getJwtCookieMaxAge } from "../utils/duration";
import { getSafeFrontendUrl } from "../utils/frontend-url";
import { GitHubAuthGuard } from "../auth/github-auth.guard";

/**
 * GitHub OAuth 认证控制器
 *
 * 路由：
 * - GET /api/auth/github - 发起 GitHub OAuth 登录
 * - GET /api/auth/github/callback - GitHub OAuth 回调
 */
@Controller("auth")
export class AuthController {
  constructor(
    private configService: ConfigService,
    private githubAuthService: GitHubAuthService,
    private authService: AuthService,
  ) {}

  @Get("providers")
  getProviders() {
    const github = [
      "GITHUB_CLIENT_ID",
      "GITHUB_CLIENT_SECRET",
      "GITHUB_CALLBACK_URL",
    ].every((key) => {
      const value = this.configService.get<string>(key)?.trim();
      return Boolean(value && !value.toLowerCase().includes("placeholder"));
    });

    return {
      success: true,
      data: { github },
    };
  }

  /**
   * 发起 GitHub OAuth 登录
   * 重定向到 GitHub 授权页面
   */
  @Get("github")
  @UseGuards(GitHubAuthGuard)
  async githubAuth(): Promise<void> {
    // Passport 会自动处理重定向到 GitHub OAuth 页面
    // 这个方法不需要实现任何逻辑
  }

  /**
   * GitHub OAuth 回调处理
   *
   * 1. GitHub 授权成功后会回调此端点
   * 2. Passport GitHub Strategy 会验证授权并获取用户信息
   * 3. 创建或查找系统用户
   * 4. 生成 JWT Token 并设置 Cookie
   * 5. 重定向到前端成功页面
   */
  @Get("github/callback")
  @UseGuards(GitHubAuthGuard)
  async githubAuthCallback(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<void> {
    if (response.headersSent) return;

    try {
      // 从 req.user 获取 GitHub 用户资料（由 Passport Strategy 注入）
      const githubProfile = req.user as GitHubProfile;

      if (!githubProfile || !githubProfile.id) {
        throw new HttpException("GitHub 用户信息无效", HttpStatus.BAD_REQUEST);
      }

      // 查找或创建系统用户
      const user =
        await this.githubAuthService.findOrCreateGitHubUser(githubProfile);

      // 使用现有的 AuthService 生成 JWT Token
      const loginResult = this.authService.login(user);

      // 设置 HttpOnly Cookie（与现有登录逻辑保持一致）
      const cookieOptions = getAuthCookieOptions(req, {
        maxAge: getJwtCookieMaxAge(),
      });

      response.cookie(
        "Authentication",
        loginResult.access_token,
        cookieOptions,
      );

      // 重定向到前端成功页面（经白名单校验，防开放重定向）
      const frontendUrl = getSafeFrontendUrl(this.configService);
      const successUrl = `${frontendUrl}/auth/github/success`;
      response.redirect(successUrl);
    } catch (error) {
      console.error("GitHub OAuth 回调处理失败:", error);

      // 重定向到前端失败页面（经白名单校验，防开放重定向）
      // 仅返回通用错误提示，避免将内部错误细节泄露到 URL
      const frontendUrl = getSafeFrontendUrl(this.configService);
      const message =
        error instanceof ConflictException
          ? "该 GitHub 账号与现有账号冲突，请先使用原账号登录"
          : "GitHub 登录失败，请稍后重试";
      const errorParam = encodeURIComponent(message);
      const redirectUrl = `${frontendUrl}/auth/github/failure?error=${errorParam}`;
      response.redirect(redirectUrl);
    }
  }

  /**
   * GitHub OAuth 成功页面
   * 前端会显示此页面并自动跳转到首页
   */
  @Get("github/success")
  githubSuccess(): { success: true; message: string } {
    return {
      success: true,
      message: "GitHub 登录成功",
    };
  }

  /**
   * GitHub OAuth 失败页面
   * 前端会显示此页面并提供返回登录页的选项
   */
  @Get("github/failure")
  githubFailure(@Req() req: Request): {
    success: false;
    message: string;
    error?: string;
  } {
    const error = req.query.error as string | undefined;
    return {
      success: false,
      message: "GitHub 登录失败",
      error: error || "未知错误",
    };
  }
}
