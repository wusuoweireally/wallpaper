import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository, IsNull } from "typeorm";
import { User, UserRole, isAdminRole } from "../entities/user.entity";
import { Post, PostStatus } from "../entities/post.entity";
import { PostBookmark } from "../entities/post-bookmark.entity";
import { PostLike } from "../entities/post-like.entity";
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateUserDto,
} from "../dto/user.dto";
import { AdminUpdateUserDto, AdminUserQueryDto } from "../dto/admin.dto";
import * as bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { UploadService } from "./upload.service";
import { PaginatedResult, normalizePagination } from "../common/pagination";
import { sanitizeUser } from "../utils/sanitize";

/** 执行敏感操作的请求者上下文（来自 @CurrentUser），用于权限护栏判断 */
export interface ActorContext {
  userId: number;
  role?: UserRole;
}

/** MySQL 唯一索引冲突：查重在事务锁外完成，并发提交的撞库兜底要用 */
const isUniqueConflict = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === "ER_DUP_ENTRY";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly uploadService: UploadService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // 创建用户
  // actor: 发起创建的管理员上下文（注册等公开流程不传，由 roleOverride 默认 USER 保证安全）
  async create(
    createUserDto: CreateUserDto,
    roleOverride: UserRole = UserRole.USER,
    actor?: ActorContext,
  ): Promise<User> {
    const normalizedEmail = createUserDto.email?.trim().toLowerCase() || null;
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

    // 检查邮箱是否已存在
    if (normalizedEmail) {
      const existingEmail = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existingEmail) {
        throw new ConflictException("邮箱已被使用");
      }
    }

    const username = createUserDto.username.trim();
    const existingUsername = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException("用户名已存在");
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const userRole = requestedRole;

    const user = this.userRepository.create({
      username,
      email: normalizedEmail,
      passwordHash: hashedPassword,
      avatarUrl: "/defaultAvatar.png", // 默认头像（走 public 静态）
      bio: createUserDto.bio || "",
      role: userRole,
    });

    try {
      return await this.userRepository.save(user);
    } catch (error: unknown) {
      if (isUniqueConflict(error)) {
        throw new ConflictException("用户名或邮箱已被使用");
      }
      throw error;
    }
  }

  // 验证用户登录
  async validateUser(account: string, password: string): Promise<User | null> {
    const normalized = account.trim();
    if (!normalized) return null;

    const user = await this.userRepository.findOne({
      where: [
        { username: normalized, status: 1, deletedAt: IsNull() },
        { email: normalized.toLowerCase(), status: 1, deletedAt: IsNull() },
      ],
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
      where: { id, deletedAt: IsNull() },
    });

    if (!user) {
      throw new NotFoundException("用户不存在");
    }

    return user;
  }

  // 更新用户信息
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    actor: ActorContext,
  ): Promise<User> {
    const user = await this.findById(id);

    if (actor.userId !== id) {
      if (!isAdminRole(actor.role)) {
        throw new ForbiddenException("无权修改该用户信息");
      }
      if (isAdminRole(user.role) && actor.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException("只有超级管理员可以修改管理员信息");
      }
    }

    // 检查用户名是否已存在（如果要更新用户名）
    const username = updateUserDto.username?.trim();
    const email =
      typeof updateUserDto.email === "string"
        ? updateUserDto.email.trim().toLowerCase()
        : updateUserDto.email;

    if (username && username !== user.username) {
      const existingUsername = await this.userRepository.findOne({
        where: { username },
      });
      if (existingUsername) {
        throw new ConflictException("用户名已存在");
      }
    }

    // 检查邮箱是否已存在（如果要更新邮箱）
    if (email !== undefined && email !== user.email) {
      if (email) {
        const existingEmail = await this.userRepository.findOne({
          where: { email },
        });
        if (existingEmail) {
          throw new ConflictException("邮箱已被使用");
        }
      }
    }

    // 更新字段
    if (username) {
      user.username = username;
    }
    if (email !== undefined) {
      user.email = email;
    }
    if (updateUserDto.bio !== undefined) {
      user.bio = updateUserDto.bio;
    }

    try {
      return await this.userRepository.save(user);
    } catch (error: unknown) {
      // 查重在锁外完成，并发提交撞唯一索引时给出业务化冲突而非 500
      if (isUniqueConflict(error)) {
        throw new ConflictException("用户名或邮箱已被使用");
      }
      throw error;
    }
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    const passwordMatches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException("当前密码错误");
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException("新密码不能与当前密码相同");
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    // 凭证版本 +1：已签发的 JWT 全部失效（含被盗会话）
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    await this.userRepository.save(user);
  }

  private async lockActiveAdmins(
    repository: Repository<User>,
  ): Promise<User[]> {
    return repository
      .createQueryBuilder("user")
      .setLock("pessimistic_write")
      .where("user.role IN (:...roles)", {
        roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
      })
      .andWhere("user.status = 1")
      .andWhere("user.deletedAt IS NULL")
      .orderBy("user.id", "ASC")
      .getMany();
  }

  private async findByIdForUpdate(
    repository: Repository<User>,
    id: number,
  ): Promise<User> {
    const user = await repository
      .createQueryBuilder("user")
      .setLock("pessimistic_write")
      .where("user.id = :id", { id })
      .andWhere("user.deletedAt IS NULL")
      .getOne();

    if (!user) {
      throw new NotFoundException("用户不存在");
    }
    return user;
  }

  private assertHasAnotherActiveAdmin(
    activeAdmins: User[],
    excludedId: number,
    message: string,
  ): void {
    const hasAnother = activeAdmins.some(
      (admin) => String(admin.id) !== String(excludedId),
    );
    if (!hasAnother) {
      throw new ForbiddenException(message);
    }
  }

  // 删除用户
  // 普通用户注销自己的账号是合法的；但管理员不得删除自己（防锁死），
  // 删除他人的管理员账号需要超级管理员权限。
  async remove(id: number, actor?: ActorContext): Promise<void> {
    const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);
    let previousAvatar: string | null = null;

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const activeAdmins = await this.lockActiveAdmins(repository);
      const user = await this.findByIdForUpdate(repository, id);

      if (actor) {
        if (actor.userId === id && isAdminRole(user.role)) {
          throw new ForbiddenException("管理员不能删除自己的账号");
        }
        if (
          actor.userId !== id &&
          isAdminRole(user.role) &&
          actor.role !== UserRole.SUPER_ADMIN
        ) {
          throw new ForbiddenException("只有超级管理员可以删除管理员账号");
        }
      }

      if (isAdminRole(user.role) && user.status === 1) {
        this.assertHasAnotherActiveAdmin(
          activeAdmins,
          id,
          "不能删除最后一个管理员账号",
        );
      }

      previousAvatar = user.avatarUrl;
      user.username = `deleted_${id}_${randomBytes(6).toString("hex")}`;
      user.email = null;
      user.passwordHash = passwordHash;
      user.avatarUrl = "defaultAvatar.png";
      user.bio = null;
      user.status = 0;
      user.role = UserRole.USER;
      user.githubId = null;
      user.githubLogin = null;
      user.githubAvatarUrl = null;
      user.githubBio = null;
      user.deletedAt = new Date();

      await repository.save(user);
    });

    await this.uploadService.deleteAvatar(previousAvatar);
  }

  async setStatus(
    id: number,
    status: number,
    actor?: ActorContext,
  ): Promise<User> {
    const nextStatus = status === 1 ? 1 : 0;
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const activeAdmins = await this.lockActiveAdmins(repository);
      const user = await this.findByIdForUpdate(repository, id);

      if (nextStatus === 0 && user.status === 1) {
        if (actor?.userId === id) {
          throw new ForbiddenException("不能禁用自己的账号");
        }
        if (
          actor &&
          isAdminRole(user.role) &&
          actor.role !== UserRole.SUPER_ADMIN
        ) {
          throw new ForbiddenException("只有超级管理员可以禁用管理员账号");
        }
        if (isAdminRole(user.role)) {
          this.assertHasAnotherActiveAdmin(
            activeAdmins,
            id,
            "不能禁用最后一个管理员账号",
          );
        }
      }

      // 禁用即吊销：递增凭证版本让禁用前签发的 JWT 全部失效，
      // 否则被冻结用户手里的旧 token 直到过期前仍然全站可用
      if (nextStatus === 0) {
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      }
      user.status = nextStatus;
      return repository.save(user);
    });
  }

  // 更新用户头像
  async updateAvatar(id: number, avatarUrl: string): Promise<User> {
    const user = await this.findById(id);
    user.avatarUrl = avatarUrl;
    return await this.userRepository.save(user);
  }

  /**
   * 当前用户收藏的已发布帖子分页列表（按收藏时间倒序）。
   * 塑形与论坛列表接口一致：作者脱敏 + isLiked，前端 PostCard 可直接复用。
   */
  async getUserBookmarkedPosts(
    userId: number,
    requestedPage = 1,
    requestedLimit = 20,
  ): Promise<PaginatedResult<Post & { isLiked: boolean }>> {
    const { page, limit } = normalizePagination(requestedPage, requestedLimit);

    const [bookmarks, total] = await this.dataSource
      .getRepository(PostBookmark)
      .createQueryBuilder("bookmark")
      .innerJoinAndSelect("bookmark.post", "post")
      .leftJoinAndSelect("post.author", "author")
      .where("bookmark.userId = :userId", { userId })
      .andWhere("post.status = :status", { status: PostStatus.PUBLISHED })
      .andWhere("post.deletedAt IS NULL")
      .orderBy("bookmark.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const posts = bookmarks.map((bookmark) => bookmark.post);

    // 批量查当前用户点赞态，避免逐帖 N+1；postId 为 bigint 统一按字符串比较
    const likes = posts.length
      ? await this.dataSource.getRepository(PostLike).find({
          where: { userId, postId: In(posts.map((post) => post.id)) },
          select: { postId: true },
        })
      : [];
    const likedPostIds = new Set(likes.map((like) => String(like.postId)));

    return {
      page,
      limit,
      total,
      data: posts.map((post) => ({
        ...post,
        author: sanitizeUser(
          post.author as unknown as Record<string, unknown>,
        ) as unknown as Post["author"],
        isLiked: likedPostIds.has(String(post.id)),
      })),
    };
  }

  async adminQueryUsers(
    query: AdminUserQueryDto,
  ): Promise<{ data: User[]; total: number }> {
    const { page = 1, limit = 20, keyword, status, role } = query;
    const qb = this.userRepository
      .createQueryBuilder("user")
      .where("user.deletedAt IS NULL");

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
    actor: ActorContext,
  ): Promise<User> {
    const passwordHash = updateDto.password
      ? await bcrypt.hash(updateDto.password, 10)
      : undefined;

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(User);
      const activeAdmins = await this.lockActiveAdmins(repository);
      const user = await this.findByIdForUpdate(repository, id);

      if (actor.role !== UserRole.SUPER_ADMIN && isAdminRole(user.role)) {
        throw new ForbiddenException("只有超级管理员可以修改管理员信息");
      }
      if (actor.userId === id && updateDto.password) {
        throw new ForbiddenException("请通过本人密码修改接口更新密码");
      }

      const disablesActiveAdmin =
        isAdminRole(user.role) &&
        user.status === 1 &&
        updateDto.status !== undefined &&
        updateDto.status !== 1;
      const demotesActiveAdmin =
        isAdminRole(user.role) &&
        user.status === 1 &&
        updateDto.role !== undefined &&
        !isAdminRole(updateDto.role);

      if (disablesActiveAdmin || demotesActiveAdmin) {
        this.assertHasAnotherActiveAdmin(
          activeAdmins,
          id,
          disablesActiveAdmin
            ? "不能禁用最后一个管理员账号"
            : "不能降级最后一个管理员账号",
        );
      }

      if (updateDto.status !== undefined && updateDto.status !== user.status) {
        if (updateDto.status === 0 && actor.userId === id) {
          throw new ForbiddenException("不能禁用自己的账号");
        }
        user.status = updateDto.status === 1 ? 1 : 0;
      }

      if (updateDto.role && updateDto.role !== user.role) {
        if (actor.role !== UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("只有超级管理员可以变更用户角色");
        }
        if (actor.userId === id) {
          throw new ForbiddenException("不能修改自己的角色");
        }
        if (updateDto.role === UserRole.SUPER_ADMIN) {
          throw new ForbiddenException("不允许通过接口设置超级管理员");
        }
        user.role = updateDto.role;
      }

      if (updateDto.username && updateDto.username !== user.username) {
        const existingUsername = await repository.findOne({
          where: { username: updateDto.username },
        });
        if (existingUsername) {
          throw new ConflictException("用户名已存在");
        }
        user.username = updateDto.username;
      }
      // 管理端邮箱与注册/自助路径同口径：去空格并统一小写后再查重落库
      const email =
        typeof updateDto.email === "string"
          ? updateDto.email.trim().toLowerCase()
          : updateDto.email;
      if (email !== undefined && email !== user.email) {
        if (email) {
          const existingEmail = await repository.findOne({
            where: { email },
          });
          if (existingEmail) {
            throw new ConflictException("邮箱已被使用");
          }
        }
        user.email = email;
      }
      if (updateDto.bio !== undefined) {
        user.bio = updateDto.bio;
      }
      if (passwordHash) {
        user.passwordHash = passwordHash;
        // 管理员重置密码与本人改密同语义：递增凭证版本吊销全部已签发 JWT
        //（被盗账号处置路径的关键一步，否则旧 token 最长存活 30 天）
        user.tokenVersion = (user.tokenVersion ?? 0) + 1;
      }

      try {
        return await repository.save(user);
      } catch (error: unknown) {
        if (isUniqueConflict(error)) {
          throw new ConflictException("用户名或邮箱已被使用");
        }
        throw error;
      }
    });
  }
}
