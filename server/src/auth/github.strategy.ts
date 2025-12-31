import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubProfile } from '../dto/github.dto';

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
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || '',
      scope: ['user:email'], // 请求读取用户邮箱的权限
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profile: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    done: (error: any, user?: any) => void,
  ): void {
    // 提取 GitHub 用户信息
    const githubProfile: GitHubProfile = {
      id: profile.id,
      login: profile.username || profile.login,
      avatar_url: profile._json.avatar_url,
      bio: profile._json.bio || '',
      email: profile.emails?.[0]?.value || profile._json.email,
      name: profile.displayName || profile._json.name,
      html_url: profile._json.html_url,
      location: profile._json.location || '',
      blog: profile._json.blog || '',
      company: profile._json.company || '',
      public_repos: profile._json.public_repos,
      followers: profile._json.followers,
      following: profile._json.following,
      created_at: profile._json.created_at,
      updated_at: profile._json.updated_at,
    };

    // 验证必需字段
    if (!githubProfile.id || !githubProfile.login) {
      done(new UnauthorizedException('GitHub 用户信息无效'), undefined);
      return;
    }

    // 返回 GitHub 用户资料，将在控制器中用于创建/查找用户
    done(null, githubProfile);
  }
}
