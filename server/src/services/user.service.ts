import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, In, Not } from "typeorm";
import { User, UserRole, isAdminRole } from "../entities/user.entity";
import { CreateUserDto, UpdateUserDto } from "../dto/user.dto";
import { AdminUpdateUserDto, AdminUserQueryDto } from "../dto/admin.dto";
import * as bcrypt from "bcryptjs";

/** 执行敏感操作的请求者上下文（来自 @CurrentUser），用于权限护栏判断 */
export interface ActorContext {
  userId: number;
  role?: UserRole;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 生成随机用户名
  private generateRandomUsername(): string {
    const adjectives = [
      "快乐的",
      "聪明的",
      "勇敢的",
      "优雅的",
      "神秘的",
      "活泼的",
      "温柔的",
      "可爱的",
    ];
    const nouns = ["用户", "朋友", "探索者", "旅行者", "梦想家", "创造者"];
    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 10000);
    return `${randomAdjective}${randomNoun}${randomNumber}`;
  }

  // 创建用户
  // actor: 发起创建的管理员上下文（注册等公开流程不传，由 roleOverride 默认 USER 保证安全）
  async create(
    createUserDto: CreateUserDto,
    roleOverride: UserRole = UserRole.USER,
    actor?: ActorContext,
  ): Promise<User> {
    // 仅允许 USER / ADMIN / SUPER_ADMIN 三种合法值，非法值统一降级为 USER
    const requestedRole = [
      UserRole.USER,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ].includes(roleOverride)
      ? roleOverride
      : UserRole.USER;

    // 权限护栏：创建特权账号（ADMIN/SUPER_ADMIN）受限
    if (isAdminRole(requestedRole) || requestedRole === UserRole.SUPER_ADMIN) {
      if (actor) {
        // 通过接口创建：仅超级管理员可创建管理员；且禁止经接口创建超级管理员
        if (actor.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("只有超级管理员可以创建管理员账号");
        }
        if (requestedRole === UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("不允许通过接口创建超级管理员账号");
        }
      }
      // actor 为空 = 系统初始化(seed)，允许创建特权账号以完成引导
    }

    // 检查用户ID是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { id: createUserDto.id },
    });
    if (existingUser) {
      throw new ConflictException("用户ID已存在");
    }

    // 检查邮箱是否已存在
    if (createUserDto.email) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: createUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    // 生成用户名（如果没有提供）
    let username = createUserDto.username;
    if (!username) {
      username = this.generateRandomUsername();
      // 确保生成的用户名是唯一的
      let isUnique = false;
      while (!isUnique) {
        const existingUsername = await this.userRepository.findOne({
          where: { username },
        });
        if (!existingUsername) {
          isUnique = true;
        } else {
          username = this.generateRandomUsername();
        }
      }
    } else {
      // 检查用户名是否已存在
      const existingUsername = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUsername) {
        throw new ConflictException("用户名已存在");
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userRole = requestedRole;

    const user = this.userRepository.create({
      id: createUserDto.id,
      username,
      email: createUserDto.email,
      passwordHash: hashedPassword,
      avatarUrl: "defaultAvatar.png", // 默认头像
      bio: createUserDto.bio || "",
      role: userRole,
    });

    return await this.userRepository.save(user);
  }

  // 验证用户登录
  async validateUser(id: number, password: string): Promise<User | null> {
    // 验证ID的有效性
    if (!id || isNaN(id) || id <= 0) {
      return null;
    }

    const user = await this.userRepository.findOne({
      where: { id, status: 1 },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      return user;
    }

    return null;
  }

  // 根据ID查找用户
  async findById(id: number): Promise<User> {
    // 验证ID的有效性
    if (!id || isNaN(id) || id <= 0) {
      throw new NotFoundException("用户ID无效");
    }

    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  // 查询所有用户
  async findAll(
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return { users, total };
  }

  // 根据用户名搜索用户
  async findByUsername(
    username: string,
    page = 1,
    limit = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { username: Like(`%${username}%`) },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return { users, total };
  }

  // 更新用户信息
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    // 检查用户名是否已存在（如果要更新用户名）
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUsername) {
        throw new ConflictException("用户名已存在");
      }
    }

    // 检查邮箱是否已存在（如果要更新邮箱）
    if (
      updateUserDto.email !== undefined &&
      updateUserDto.email !== user.email
    ) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingEmail) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    // 更新字段
    if (updateUserDto.username) {
      user.username = updateUserDto.username;
    }
    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      user.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }
    if (updateUserDto.avatarUrl) {
      user.avatarUrl = updateUserDto.avatarUrl;
    }
    if (updateUserDto.bio !== undefined) {
      user.bio = updateUserDto.bio;
    }

    return await this.userRepository.save(user);
  }

  /** 统计除指定用户外，仍处于启用状态的管理员（含超管）数量 */
  private async countOtherActiveAdmins(excludeId: number): Promise<number> {
    return this.userRepository.count({
      where: {
        id: Not(excludeId),
        role: In([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
        status: 1,
      },
    });
  }

  // 删除用户
  // 普通用户注销自己的账号是合法的；但管理员不得删除自己（防锁死），
  // 删除他人的管理员账号需要超级管理员权限。
  async remove(id: number, actor?: ActorContext): Promise<void> {
    const user = await this.findById(id);

    if (actor) {
      if (actor.userId === id) {
        // 管理员不能删除自己，避免误删导致管理能力丢失
        if (isAdminRole(user.role)) {
          throw new ForbiddenException("管理员不能删除自己的账号");
        }
      } else {
        // 删除他人：仅超级管理员可删除管理员/超管账号
        if (isAdminRole(user.role) && actor.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("只有超级管理员可以删除管理员账号");
        }
      }
    }

    // 禁止删除最后一个管理员，避免系统永久失去管理能力
    if (isAdminRole(user.role)) {
      const others = await this.countOtherActiveAdmins(id);
      if (others === 0) {
        throw new ForbiddenException("不能删除最后一个管理员账号");
      }
    }

    await this.userRepository.remove(user);
  }

  // 禁用/启用用户（翻转当前状态）
  async toggleStatus(id: number, actor?: ActorContext): Promise<User> {
    const user = await this.findById(id);
    const nextStatus = user.status === 1 ? 0 : 1;
    return this.setStatus(id, nextStatus, actor);
  }

  async setStatus(
    id: number,
    status: number,
    actor?: ActorContext,
  ): Promise<User> {
    const user = await this.findById(id);
    const nextStatus = status === 1 ? 1 : 0;

    if (nextStatus === 0) {
      if (actor) {
        // 禁止禁用自己
        if (actor.userId === id) {
          throw new ForbiddenException("不能禁用自己的账号");
        }
        // 仅超级管理员可禁用管理员/超管账号
        if (isAdminRole(user.role) && actor.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("只有超级管理员可以禁用管理员账号");
        }
      }
      // 禁止禁用最后一个管理员
      if (isAdminRole(user.role)) {
        const others = await this.countOtherActiveAdmins(id);
        if (others === 0) {
          throw new ForbiddenException("不能禁用最后一个管理员账号");
        }
      }
    }

    user.status = nextStatus;
    return await this.userRepository.save(user);
  }

  // 更新用户头像
  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }

  async adminQueryUsers(
    query: AdminUserQueryDto,
  ): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 20, keyword, status, role } = query;
    const qb = this.userRepository.createQueryBuilder("user");

    if (keyword) {
      qb.andWhere("(user.username LIKE :keyword OR user.email LIKE :keyword)", {
        keyword: `%${keyword}%`,
      });
    }

    if (status !== undefined) {
      qb.andWhere("user.status = :status", { status });
    }

    if (role) {
      qb.andWhere("user.role = :role", { role });
    }

    const [data, total] = await qb
      .orderBy("user.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async adminUpdateUser(
    id: number,
    updateDto: AdminUpdateUserDto,
    actor?: ActorContext,
  ): Promise<User> {
    const baseFields: UpdateUserDto = {
      username: updateDto.username,
      email: updateDto.email,
      password: updateDto.password,
      avatarUrl: updateDto.avatarUrl,
      bio: updateDto.bio,
    };

    const updated = await this.update(id, baseFields);

    let shouldSave = false;

    // —— 状态变更护栏 ——
    if (updateDto.status !== undefined && updateDto.status !== updated.status) {
      const nextStatus = updateDto.status === 1 ? 1 : 0;
      if (nextStatus === 0) {
        if (actor) {
          if (actor.userId === id) {
            throw new ForbiddenException("不能禁用自己的账号");
          }
          if (
            isAdminRole(updated.role) &&
            actor.role !== UserRole.SUPER_ADMIN
          ) {
            throw new ForbiddenException("只有超级管理员可以禁用管理员账号");
          }
        }
        if (isAdminRole(updated.role)) {
          const others = await this.countOtherActiveAdmins(id);
          if (others === 0) {
            throw new ForbiddenException("不能禁用最后一个管理员账号");
          }
        }
      }
      updated.status = nextStatus;
      shouldSave = true;
    }

    // —— 角色变更护栏 ——
    if (updateDto.role && updateDto.role !== updated.role) {
      if (actor) {
        // 仅超级管理员可变更角色
        if (actor.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("只有超级管理员可以变更用户角色");
        }
        // 禁止修改自己的角色，防止自我降级导致权限锁死
        if (actor.userId === id) {
          throw new ForbiddenException("不能修改自己的角色");
        }
        // 禁止通过接口将他人提升为超级管理员
        if (updateDto.role === UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("不允许通过接口设置超级管理员");
        }
      }
      // 将管理员降级为普通用户时，确保不是最后一个管理员
      if (isAdminRole(updated.role) && !isAdminRole(updateDto.role)) {
        const others = await this.countOtherActiveAdmins(id);
        if (others === 0) {
          throw new ForbiddenException("不能降级最后一个管理员账号");
        }
      }
      updated.role = updateDto.role;
      shouldSave = true;
    }

    if (shouldSave) {
      await this.userRepository.save(updated);
    }

    return updated;
  }
}
