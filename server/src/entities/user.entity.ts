import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
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
  @PrimaryColumn("bigint", { comment: "用户ID" })
  id: number;

  @Column({ length: 50, unique: true, comment: "用户名" })
  username: string;

  @Column({ length: 100, unique: true, nullable: true, comment: "邮箱地址" })
  email: string;

  @Column({ name: "password_hash", length: 255, comment: "密码哈希值" })
  passwordHash: string;

  @Column({
    name: "avatar_url",
    length: 500,
    nullable: true,
    default: "defaultAvatar.png",
    comment: "头像URL",
  })
  avatarUrl: string;

  @Column({ type: "text", nullable: true, comment: "个人简介" })
  bio: string;

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
  githubId: number;

  @Column({
    name: "github_login",
    length: 100,
    nullable: true,
    comment: "GitHub用户名",
  })
  githubLogin: string;

  @Column({
    name: "github_avatar_url",
    length: 500,
    nullable: true,
    comment: "GitHub头像URL",
  })
  githubAvatarUrl: string;

  @Column({
    name: "github_bio",
    type: "text",
    nullable: true,
    comment: "GitHub个人简介",
  })
  githubBio: string;

  @DeleteDateColumn({
    name: "deleted_at",
    nullable: true,
    comment: "删除时间（软删除）",
  })
  deletedAt: Date;
}
