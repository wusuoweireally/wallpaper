import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User, UserRole } from "../entities/user.entity";

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const adminIdRaw = this.configService.get<string>("ADMIN_USER_ID");
    const adminPassword = this.configService.get<string>("ADMIN_USER_PASSWORD");

    if (!adminIdRaw || !adminPassword) {
      this.logger.warn(
        "未配置 ADMIN_*，跳过管理员引导：启动后系统将没有超级管理员账号。",
      );
      return;
    }

    if (
      ["your_admin_password", "change_me", "changeme", "replace_me"].includes(
        adminPassword.trim().toLowerCase(),
      )
    ) {
      throw new Error("ADMIN_USER_PASSWORD 不能使用示例占位值");
    }

    const adminId = Number(adminIdRaw);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      this.logger.warn("ADMIN_USER_ID 无效，跳过创建管理员。");
      return;
    }

    // 仅当系统中已存在（未注销的）超级管理员时才跳过；
    // 否则即使存在普通 ADMIN，也需要把指定账号提升为 SUPER_ADMIN，
    // 避免引入角色层级护栏后出现“无人拥有超级管理员权限、无法管理角色”的死锁。
    const existingSuperAdmin = await this.userRepository.findOne({
      where: { role: UserRole.SUPER_ADMIN, deletedAt: IsNull() },
    });
    if (existingSuperAdmin) {
      this.logger.log("已存在超级管理员账号，跳过初始化。");
      return;
    }

    const adminEmail = this.configService.get<string>("ADMIN_USER_EMAIL");
    const adminUsername = this.configService.get<string>("ADMIN_USER_USERNAME");

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const existingById = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (existingById?.deletedAt) {
      // 指定 ID 已软删：同 ID 受主键约束无法重建，交由运营改配 ADMIN_USER_ID
      this.logger.warn(
        "指定 ADMIN_USER_ID 的账号已注销且无法同号重建，请更换后重启。",
      );
      return;
    }

    if (existingById) {
      // 如果指定 ID 已存在（如旧的 ADMIN），则提升为超级管理员并更新凭证
      if (adminEmail) {
        const emailOwner = await this.userRepository.findOne({
          where: { email: adminEmail, deletedAt: IsNull() },
        });
        if (!emailOwner || emailOwner.id === existingById.id) {
          existingById.email = adminEmail;
        } else {
          this.logger.warn("管理员邮箱已被占用，跳过邮箱更新。");
        }
      }

      if (adminUsername) {
        const usernameOwner = await this.userRepository.findOne({
          where: { username: adminUsername, deletedAt: IsNull() },
        });
        if (!usernameOwner || usernameOwner.id === existingById.id) {
          existingById.username = adminUsername;
        } else {
          this.logger.warn("管理员用户名已被占用，跳过用户名更新。");
        }
      }

      existingById.passwordHash = passwordHash;
      existingById.role = UserRole.SUPER_ADMIN;
      existingById.status = 1;
      // 与管理员重置密码同语义：种子换凭证也递增版本，吊销升级前的旧会话
      existingById.tokenVersion = (existingById.tokenVersion ?? 0) + 1;

      await this.userRepository.save(existingById);
      this.logger.log("管理员账号已存在并完成升级。");
      return;
    }

    // 创建新的管理员账号
    let finalUsername = adminUsername?.trim() || "admin";
    const usernameOwner = await this.userRepository.findOne({
      where: { username: finalUsername, deletedAt: IsNull() },
    });
    if (usernameOwner) {
      finalUsername = `admin${adminId}`;
    }

    let finalEmail: string | undefined;
    if (adminEmail) {
      const emailOwner = await this.userRepository.findOne({
        where: { email: adminEmail, deletedAt: IsNull() },
      });
      if (!emailOwner) {
        finalEmail = adminEmail;
      } else {
        this.logger.warn("管理员邮箱已被占用，将跳过邮箱设置。");
      }
    }

    const adminUser = this.userRepository.create({
      id: adminId,
      username: finalUsername,
      passwordHash,
      avatarUrl: "defaultAvatar.png",
      bio: "",
      role: UserRole.SUPER_ADMIN,
      status: 1,
    });
    if (finalEmail) {
      adminUser.email = finalEmail;
    }

    await this.userRepository.save(adminUser);
    this.logger.log("管理员账号已创建。");
  }
}
