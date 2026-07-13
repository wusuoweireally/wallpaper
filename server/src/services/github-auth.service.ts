import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { User, UserRole } from "../entities/user.entity";
import { GitHubProfile } from "../dto/github.dto";

/**
 * GitHub 认证服务
 *
 * 职责：
 * 1. 根据 GitHub 用户信息查找或创建系统用户
 * 2. 生成唯一的系统用户名
 * 3. 生成随机密码
 * 4. 同步 GitHub 头像和个人简介
 */
@Injectable()
export class GitHubAuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 根据 GitHub 用户资料查找或创建用户
   *
   * @param githubProfile - GitHub 用户资料
   * @returns 系统用户实例
   */
  async findOrCreateGitHubUser(githubProfile: GitHubProfile): Promise<User> {
    // 1. 根据 GitHub ID 查找已有用户
    let user = await this.userRepository.findOne({
      where: { githubId: githubProfile.id },
    });

    if (user) {
      this.assertActiveUser(user);
      // 2. 如果用户已存在，更新 GitHub 信息并返回
      user = await this.syncGitHubProfile(user, githubProfile);
      return user;
    }

    // 3. 如果用户不存在，创建新用户
    user = await this.createGitHubUser(githubProfile);
    return user;
  }

  /**
   * 创建新的 GitHub 用户
   *
   * @param githubProfile - GitHub 用户资料
   * @returns 新创建的用户
   */
  private async createGitHubUser(githubProfile: GitHubProfile): Promise<User> {
    const email = githubProfile.email?.trim().toLowerCase() || null;
    if (email) {
      const emailOwner = await this.userRepository.findOne({
        where: { email },
      });
      if (emailOwner) {
        throw new ConflictException("该邮箱已注册，请使用原账号登录");
      }
    }

    // 用户名包含 GitHub ID，既可读又天然唯一。
    const username = this.generateUsername(
      githubProfile.login,
      githubProfile.id,
    );

    // 生成随机密码并哈希
    const randomPassword = this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const newUser = this.userRepository.create({
      username,
      passwordHash,
      email,
      avatarUrl: githubProfile.avatar_url,
      bio: githubProfile.bio || "",
      githubId: githubProfile.id,
      githubLogin: githubProfile.login,
      githubAvatarUrl: githubProfile.avatar_url,
      githubBio: githubProfile.bio || "",
      role: UserRole.USER,
      status: 1,
    });

    // 保存到数据库
    try {
      return await this.userRepository.save(newUser);
    } catch (error: unknown) {
      // 处理用户名或ID冲突
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ) {
        const existing = await this.userRepository.findOne({
          where: { githubId: githubProfile.id },
        });
        if (existing) {
          this.assertActiveUser(existing);
          return existing;
        }
        throw new ConflictException("用户创建失败：用户名或邮箱已存在");
      }
      throw error;
    }
  }

  private assertActiveUser(user: User): void {
    if (user.status !== 1 || user.deletedAt) {
      throw new UnauthorizedException("账号已禁用");
    }
  }

  /**
   * 生成唯一的系统用户名
   * 格式：github_{githubLogin}_{githubId}
   *
   * @param githubLogin - GitHub 用户名
   * @param githubId - GitHub 用户ID
   * @returns 系统用户名
   */
  private generateUsername(githubLogin: string, githubId: number): string {
    // 清理用户名：移除特殊字符，只保留字母、数字、下划线和减号
    const cleanLogin = githubLogin.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 25);
    return `github_${cleanLogin}_${githubId}`;
  }

  /**
   * 生成随机密码
   *
   * @returns 随机密码（32个字符）
   */
  private generateRandomPassword(): string {
    const length = 32;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?";
    let password = "";

    // 使用 crypto 生成安全的随机密码
    const array = new Uint32Array(length);
    const bytes = crypto.randomBytes(length * 4);
    for (let i = 0; i < length; i++) {
      array[i] = bytes.readUInt32BE(i * 4);
    }

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    return password;
  }

  /**
   * 同步 GitHub 用户资料到系统用户
   *
   * @param user - 系统用户实例
   * @param githubProfile - GitHub 用户资料
   * @returns 更新后的用户
   */
  async syncGitHubProfile(
    user: User,
    githubProfile: GitHubProfile,
  ): Promise<User> {
    // 更新 GitHub 相关字段
    user.githubLogin = githubProfile.login;
    user.githubAvatarUrl = githubProfile.avatar_url;
    user.githubBio = githubProfile.bio || "";

    // 如果用户没有头像，使用 GitHub 头像
    if (!user.avatarUrl || user.avatarUrl === "defaultAvatar.png") {
      user.avatarUrl = githubProfile.avatar_url;
    }

    // 如果用户没有简介，使用 GitHub 简介
    if (!user.bio) {
      user.bio = githubProfile.bio || "";
    }

    // 已绑定账号可以继续登录，但不能占用另一个本地账号的邮箱。
    const email = githubProfile.email?.trim().toLowerCase();
    if (!user.email && email) {
      const emailOwner = await this.userRepository.findOne({
        where: { email },
      });
      if (!emailOwner) {
        user.email = email;
      }
    }

    // 保存更新
    return await this.userRepository.save(user);
  }
}
