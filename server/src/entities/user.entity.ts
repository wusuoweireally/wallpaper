import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

/** 角色权重：用于守卫的层级判断，数值越大权限越高 */
export const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPER_ADMIN]: 2,
};

/** 是否为管理员及以上（ADMIN 或 SUPER_ADMIN） */
export const isAdminRole = (role?: UserRole): boolean =>
  role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "用户ID" })
  id: number;

  @Column({ length: 50, unique: true, comment: "用户名" })
  username: string;

  @Column({
    type: "varchar",
    length: 100,
    unique: true,
    nullable: true,
    comment: "邮箱地址",
  })
  email: string | null;

  @Column({ name: "password_hash", length: 255, comment: "密码哈希值" })
  passwordHash: string;

  @Column({
    name: "avatar_url",
    type: "varchar",
    length: 500,
    nullable: true,
    default: "defaultAvatar.png",
    comment: "头像URL",
  })
  avatarUrl: string | null;

  @Column({ type: "text", nullable: true, comment: "个人简介" })
  bio: string | null;

  @CreateDateColumn({ name: "created_at", comment: "创建时间" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", comment: "更新时间" })
  updatedAt: Date;

  @Column({ type: "tinyint", default: 1, comment: "用户状态 1:正常 0:禁用" })
  status: number;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
    comment: "用户角色",
  })
  role: UserRole;

  @Column({
    name: "github_id",
    type: "bigint",
    nullable: true,
    unique: true,
    comment: "GitHub用户ID",
  })
  githubId: number | null;

  @Column({
    name: "github_login",
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "GitHub用户名",
  })
  githubLogin: string | null;

  @Column({
    name: "github_avatar_url",
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "GitHub头像URL",
  })
  githubAvatarUrl: string | null;

  @Column({
    name: "github_bio",
    type: "text",
    nullable: true,
    comment: "GitHub个人简介",
  })
  githubBio: string | null;

  @Column({
    name: "deleted_at",
    type: "datetime",
    nullable: true,
    comment: "删除时间（软删除）",
  })
  deletedAt: Date | null;
}
