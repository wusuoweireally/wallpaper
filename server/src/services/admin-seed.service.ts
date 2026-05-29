import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
      this.logger.log("未配置管理员初始化信息，跳过创建管理员。");
      return;
    }

    const adminId = Number(adminIdRaw);
    if (!Number.isInteger(adminId) || adminId <= 0) {
      this.logger.warn("ADMIN_USER_ID 无效，跳过创建管理员。");
      return;
    }

    const existingAdmin = await this.userRepository.findOne({
      where: [{ role: UserRole.SUPER_ADMIN }, { role: UserRole.ADMIN }],
    });
    if (existingAdmin) {
      this.logger.log("已存在管理员账号，跳过初始化。");
      return;
    }

    const adminEmail = this.configService.get<string>("ADMIN_USER_EMAIL");
    const adminUsername = this.configService.get<string>("ADMIN_USER_USERNAME");

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const existingById = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (existingById) {
      // 如果指定 ID 已存在，则升级为管理员并更新凭证
      if (adminEmail) {
        const emailOwner = await this.userRepository.findOne({
          where: { email: adminEmail },
        });
        if (!emailOwner || emailOwner.id === existingById.id) {
          existingById.email = adminEmail;
        } else {
          this.logger.warn("管理员邮箱已被占用，跳过邮箱更新。");
        }
      }

      if (adminUsername) {
        const usernameOwner = await this.userRepository.findOne({
          where: { username: adminUsername },
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

      await this.userRepository.save(existingById);
      this.logger.log("管理员账号已存在并完成升级。");
      return;
    }

    // 创建新的管理员账号
    let finalUsername = adminUsername?.trim() || "admin";
    const usernameOwner = await this.userRepository.findOne({
      where: { username: finalUsername },
    });
    if (usernameOwner) {
      finalUsername = `admin${adminId}`;
    }

    let finalEmail: string | undefined;
    if (adminEmail) {
      const emailOwner = await this.userRepository.findOne({
        where: { email: adminEmail },
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
