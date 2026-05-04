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

@Entity("post_bookmarks")
@Index(["userId", "postId"], { unique: true })
export class PostBookmark {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "收藏ID" })
  id: number;

  @Column({ name: "user_id", type: "bigint", comment: "用户ID" })
  @Index("idx_bookmark_user_id")
  userId: number;

  @Column({ name: "post_id", type: "bigint", comment: "帖子ID" })
  @Index("idx_bookmark_post_id")
  postId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Post, { onDelete: "CASCADE" })
  @JoinColumn({ name: "post_id" })
  post: Post;

  @CreateDateColumn({ name: "created_at", comment: "收藏时间" })
  @Index("idx_bookmark_created_at")
  createdAt: Date;
}
