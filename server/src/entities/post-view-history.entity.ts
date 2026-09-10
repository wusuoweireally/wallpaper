import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Post } from "./post.entity";

/** 登录用户的帖子浏览记录，唯一键去重：同一用户同一帖 1 小时内只计一次浏览 */
@Entity("post_view_history")
@Index(["userId", "viewedAt"]) // 复合索引：用户ID + 浏览时间
@Index("uk_post_view_history_user_post", ["userId", "postId"], {
  unique: true,
})
export class PostViewHistory {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "浏览记录ID" })
  id: number;

  @Column({ name: "user_id", type: "bigint", comment: "用户ID" })
  @Index("idx_pvh_user_id")
  userId: number;

  @Column({ name: "post_id", type: "bigint", comment: "帖子ID" })
  @Index("idx_pvh_post_id")
  postId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Post, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post: Post;

  @CreateDateColumn({ name: "viewed_at", comment: "浏览时间" })
  @Index("idx_pvh_viewed_at")
  viewedAt: Date;
}
