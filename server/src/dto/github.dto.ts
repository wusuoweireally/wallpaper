/**
 * Passport-GitHub2 的 profile 参数接口
 * 来自 passport-github2 返回的原始数据
 */
export interface PassportGitHubProfile {
  id: number;
  username: string;
  displayName?: string;
  _json: {
    avatar_url: string;
    bio: string | null;
    email: string | null;
    name: string | null;
    html_url: string;
    location: string | null;
    blog: string | null;
    company: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
    updated_at: string;
  };
  emails?: Array<{
    value: string;
    primary: boolean;
    verified: boolean;
    visibility: string | null;
  }>;
  provider?: string;
}

/**
 * GitHub 用户资料接口
 * 从 GitHub OAuth API 返回的用户信息
 */
export interface GitHubProfile {
  id: number; // GitHub 用户ID
  login: string; // GitHub 用户名
  avatar_url: string; // GitHub 头像URL
  bio: string; // GitHub 个人简介
  email: string; // GitHub 邮箱（如果公开）
  name: string; // GitHub 显示名称
  html_url: string; // GitHub 主页链接
  location: string; // 位置信息
  blog: string; // 博客地址
  company: string; // 公司信息
  public_repos: number; // 公开仓库数量
  followers: number; // 粉丝数量
  following: number; // 关注数量
  created_at: string; // 账号创建时间
  updated_at: string; // 更新时间
}

/**
 * GitHub OAuth 响应接口
 */
export interface GitHubAuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * GitHub 用户信息简化接口
 * 用于内部处理
 */
export interface GitHubUserInfo {
  githubId: number;
  githubLogin: string;
  githubAvatarUrl: string;
  githubBio: string;
  email?: string;
  name?: string;
}
