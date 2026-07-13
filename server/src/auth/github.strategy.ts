import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-github2";
import { GitHubProfile, PassportGitHubProfile } from "../dto/github.dto";
import { OAuthStateStore } from "./oauth-state.store";

/**
 * GitHub OAuth 2.0 认证策略
 *
 * 功能：
 * 1. 配置 GitHub OAuth 应用凭证
 * 2. 处理 GitHub OAuth 授权流程
 * 3. 获取 GitHub 用户信息
 * 4. 验证 state 参数防止 CSRF 攻击
 */
@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(private configService: ConfigService) {
    const clientID = configService.get<string>("GITHUB_CLIENT_ID");
    const clientSecret = configService.get<string>("GITHUB_CLIENT_SECRET");
    const callbackURL = configService.get<string>("GITHUB_CALLBACK_URL");

    super({
      clientID:
        clientID && !clientID.includes("placeholder")
          ? clientID
          : "placeholder_client_id",
      clientSecret:
        clientSecret && !clientSecret.includes("placeholder")
          ? clientSecret
          : "placeholder_client_secret",
      callbackURL:
        callbackURL || "http://localhost:1234/api/auth/github/callback",
      scope: ["user:email"],
      allRawEmails: true,
      store: new OAuthStateStore(),
    });
  }

  /**
   * 验证 GitHub OAuth 回调
   *
   * @param accessToken - GitHub 访问令牌
   * @param refreshToken - GitHub 刷新令牌
   * @param profile - GitHub 用户资料
   * @param done - Passport 回调函数
   */
  validate(
    accessToken: string,
    refreshToken: string,
    profile: PassportGitHubProfile,
    done: (error: Error | null, user?: GitHubProfile) => void,
  ): void {
    const verifiedEmail = profile.emails?.find(
      (email) => email.primary && email.verified,
    )?.value;

    // 提取 GitHub 用户信息
    const githubProfile: GitHubProfile = {
      id: profile.id,
      login: profile.username || profile.displayName || "",
      avatar_url: profile._json.avatar_url,
      bio: profile._json.bio || "",
      email: verifiedEmail?.trim().toLowerCase() || "",
      name: profile.displayName || profile._json.name || "",
      html_url: profile._json.html_url,
      location: profile._json.location || "",
      blog: profile._json.blog || "",
      company: profile._json.company || "",
      public_repos: profile._json.public_repos,
      followers: profile._json.followers,
      following: profile._json.following,
      created_at: profile._json.created_at,
      updated_at: profile._json.updated_at,
    };

    // 验证必需字段
    if (!githubProfile.id || !githubProfile.login) {
      done(new UnauthorizedException("GitHub 用户信息无效"), undefined);
      return;
    }

    // 返回 GitHub 用户资料，将在控制器中用于创建/查找用户
    done(null, githubProfile);
  }
}
