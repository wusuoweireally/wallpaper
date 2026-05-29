import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { GitHubAuthService } from "../services/github-auth.service";
import { AuthService } from "../services/auth.service";
import { GitHubProfile } from "../dto/github.dto";
import { getAuthCookieOptions } from "../utils/cookie";

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

  /**
   * 获取经校验的前端基础地址，防止 OAuth 回调被滥用为开放重定向。
   * - 仅允许 http/https 协议；
   * - 若配置了 ALLOWED_FRONTEND_ORIGINS（逗号分隔），则校验来源白名单；
   * - 任何异常情况回退到安全默认值。
   */
  private getSafeFrontendUrl(): string {
    const fallback = "http://localhost:1234";
    const configured = this.configService.get<string>("FRONTEND_URL", fallback);

    let parsed: URL;
    try {
      parsed = new URL(configured);
    } catch {
      return fallback;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return fallback;
    }

    const allowlistRaw = this.configService.get<string>(
      "ALLOWED_FRONTEND_ORIGINS",
    );
    if (allowlistRaw) {
      const allowed = allowlistRaw
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
      if (!allowed.includes(parsed.origin)) {
        return fallback;
      }
    }

    return configured.replace(/\/$/, "");
  }

  /**
   * 发起 GitHub OAuth 登录
   * 重定向到 GitHub 授权页面
   */
  @Get("github")
  @UseGuards(AuthGuard("github"))
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
  @UseGuards(AuthGuard("github"))
  async githubAuthCallback(
    @Req() req: Request,
    @Res() response: Response,
  ): Promise<void> {
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
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30天（与 JWT_EXPIRES_IN 一致）
      });

      response.cookie(
        "Authentication",
        loginResult.access_token,
        cookieOptions,
      );

      // 重定向到前端成功页面（经白名单校验，防开放重定向）
      const frontendUrl = this.getSafeFrontendUrl();
      const successUrl = `${frontendUrl}/auth/github/success`;
      response.redirect(successUrl);
    } catch (error) {
      console.error("GitHub OAuth 回调处理失败:", error);

      // 重定向到前端失败页面（经白名单校验，防开放重定向）
      // 仅返回通用错误提示，避免将内部错误细节泄露到 URL
      const frontendUrl = this.getSafeFrontendUrl();
      const errorParam = encodeURIComponent("GitHub 登录失败，请稍后重试");
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
