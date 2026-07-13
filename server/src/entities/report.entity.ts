import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

export enum ReportTargetType {
  POST = "post",
  COMMENT = "comment",
}

export enum ReportReason {
  SPAM = "spam",
  INAPPROPRIATE = "inappropriate",
  HARASSMENT = "harassment",
  VIOLENCE = "violence",
  COPYRIGHT = "copyright",
  MISINFORMATION = "misinformation",
  OTHER = "other",
}

export enum ReportStatus {
  PENDING = "pending",
  REVIEWING = "reviewing",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

export interface ReportTargetSnapshot {
  title: string | null;
  content: string;
  authorId: number;
  postId: number;
}

@Entity("reports")
@Index(["status", "createdAt"]) // 复合索引：状态 + 创建时间
@Index("uk_reports_user_target", ["userId", "targetType", "targetId"], {
  unique: true,
})
export class Report {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "举报记录ID" })
  id: number;

  @Column({ name: "user_id", type: "bigint", comment: "举报人ID" })
  userId: number;

  @Column({
    name: "target_type",
    type: "enum",
    enum: ReportTargetType,
    comment: "举报目标类型",
  })
  targetType: ReportTargetType;

  @Column({ name: "target_id", type: "bigint", comment: "举报目标ID" })
  targetId: number;

  @Column({
    name: "target_snapshot",
    type: "json",
    nullable: true,
    comment: "举报创建时的目标内容快照",
  })
  targetSnapshot: ReportTargetSnapshot | null;

  @Column({
    name: "reason",
    type: "enum",
    enum: ReportReason,
    comment: "举报原因",
  })
  reason: ReportReason;

  @Column({
    name: "description",
    type: "text",
    nullable: true,
    comment: "举报描述",
  })
  description: string | null;

  @Column({
    name: "status",
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    comment: "处理状态",
  })
  status: ReportStatus;

  @Column({
    name: "reviewed_by",
    type: "bigint",
    nullable: true,
    comment: "处理人ID",
  })
  reviewedBy: number | null;

  @Column({
    name: "review_note",
    type: "text",
    nullable: true,
    comment: "处理说明",
  })
  reviewNote: string | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
    comment: "创建时间",
  })
  createdAt: Date;

  @Column({
    name: "updated_at",
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    comment: "更新时间",
  })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "user_id" })
  user: User;

  // target_id 是多态外键（根据 targetType 指向 Post 或 Comment），
  // 不能同时建两个 @ManyToOne 到同一列（MySQL 双外键约束冲突）。
  // 关联数据在 Service 层根据 targetType 手动加载。

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "reviewed_by" })
  reviewer: User | null;
}
