import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { CollectionWallpaper } from "./collection-wallpaper.entity";

@Entity("collections")
@Index("idx_collections_user_created", ["userId", "createdAt"])
export class Collection {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "合集ID" })
  id: number;

  @Column({ name: "user_id", type: "bigint", comment: "用户ID" })
  @Index("idx_collections_user_id")
  userId: number;

  @Column({ length: 80, comment: "合集名称" })
  name: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @OneToMany(() => CollectionWallpaper, (cw) => cw.collection)
  items: CollectionWallpaper[];

  @CreateDateColumn({ name: "created_at", comment: "创建时间" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", comment: "更新时间" })
  updatedAt: Date;
}
