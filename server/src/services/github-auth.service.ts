import { Injectable, ConflictException } from "@nestjs/common";
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
    // 生成唯一系统用户名（格式：github_{githubLogin}_{githubId}）
    const username = this.generateUsername(
      githubProfile.login,
      githubProfile.id,
    );

    // 生成随机密码并哈希
    const randomPassword = this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // 生成新的用户ID（使用数据库自增或雪花算法）
    // 这里使用当前时间戳 + 随机数作为简单ID
    const newUserId = this.generateUserId();

    // 创建用户实例（不设置 id，让数据库自动生成）
    const newUser = new User();
    newUser.id = newUserId; // 手动设置主键
    newUser.username = username;
    newUser.passwordHash = passwordHash;
    // email 字段可能为空，只在有值时设置
    if (githubProfile.email) {
      newUser.email = githubProfile.email;
    }
    newUser.avatarUrl = githubProfile.avatar_url;
    newUser.bio = githubProfile.bio || "";
    newUser.githubId = githubProfile.id;
    newUser.githubLogin = githubProfile.login;
    newUser.githubAvatarUrl = githubProfile.avatar_url;
    newUser.githubBio = githubProfile.bio || "";
    newUser.role = UserRole.USER; // 使用枚举值
    newUser.status = 1;

    // 保存到数据库
    try {
      const savedUsers = await this.userRepository.save(newUser);
      const savedUser = Array.isArray(savedUsers) ? savedUsers[0] : savedUsers;
      return savedUser as User;
    } catch (error: unknown) {
      // 处理用户名或ID冲突
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ER_DUP_ENTRY"
      ) {
        throw new ConflictException("用户创建失败：用户名或ID已存在");
      }
      throw error;
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
    const cleanLogin = githubLogin.replace(/[^a-zA-Z0-9_-]/g, "");
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
    if (typeof window !== "undefined") {
      // 浏览器环境
      window.crypto.getRandomValues(array);
    } else {
      // Node.js 环境
      const bytes = crypto.randomBytes(length * 4);
      for (let i = 0; i < length; i++) {
        array[i] = bytes.readUInt32BE(i * 4);
      }
    }

    for (let i = 0; i < length; i++) {
      password += charset[array[i] % charset.length];
    }

    return password;
  }

  /**
   * 生成新的用户ID
   * 使用时间戳 + 随机数确保唯一性
   *
   * @returns 用户ID
   */
  private generateUserId(): number {
    // 使用当前时间戳（毫秒）的最后7位 + 随机4位数
    const timestamp = Date.now() % 10000000;
    const random = Math.floor(Math.random() * 10000);
    return timestamp * 10000 + random;
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

    // 如果用户没有邮箱，使用 GitHub 邮箱
    if (!user.email && githubProfile.email) {
      user.email = githubProfile.email;
    }

    // 保存更新
    return await this.userRepository.save(user);
  }

  /**
   * 根据 GitHub ID 查找用户
   *
   * @param githubId - GitHub 用户ID
   * @returns 用户实例或 null
   */
  async findByGitHubId(githubId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { githubId },
    });
  }

  /**
   * 检查用户是否绑定 GitHub 账号
   *
   * @param userId - 系统用户ID
   * @returns 是否已绑定
   */
  async isGitHubLinked(userId: number): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ["githubId"],
    });
    return Boolean(user?.githubId);
  }
}
