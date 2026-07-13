import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "./user.entity";
import { Tag } from "./tag.entity";

export enum WallpaperStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

@Entity("wallpapers")
export class Wallpaper {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "壁纸ID" })
  id: number;

  @Column({ name: "file_url", length: 500, comment: "壁纸文件URL" })
  fileUrl: string;

  @Column({
    type: "enum",
    enum: ["general", "anime", "people"],
    default: "general",
    comment: "分类: general-通用, anime-动画, people-人物",
  })
  @Index("idx_category")
  category: "general" | "anime" | "people";

  @Column({
    name: "sub_category",
    length: 50,
    nullable: true,
    comment:
      "子分类: nature-自然, city-城市, abstract-抽象, cyberpunk-赛博朋克, minimal-极简, dark-暗黑, cute-可爱, game-游戏, movie-影视, other-其他",
  })
  @Index("idx_sub_category")
  subCategory: string;

  @Column({
    name: "thumbnail_url",
    length: 500,
    nullable: true,
    comment: "缩略图URL",
  })
  thumbnailUrl: string;

  @Column({ name: "file_size", type: "bigint", comment: "文件大小(字节)" })
  fileSize: number;

  @Column({ length: 20, nullable: true, comment: "文件格式" })
  format: string;

  @Column({ type: "int", comment: "图片宽度" })
  width: number;

  @Column({ type: "int", comment: "图片高度" })
  height: number;

  @Column({
    name: "aspect_ratio",
    type: "decimal",
    precision: 5,
    scale: 2,
    nullable: true,
    comment: "宽高比",
  })
  @Index("idx_aspect_ratio")
  aspectRatio: number;

  @Column({ name: "uploader_id", type: "bigint", comment: "上传者ID" })
  @Index("idx_uploader_id")
  uploaderId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "uploader_id" })
  uploader: User;

  @Column({ name: "view_count", type: "int", default: 0, comment: "浏览次数" })
  @Index("idx_view_count_desc")
  viewCount: number;

  @Column({ name: "like_count", type: "int", default: 0, comment: "点赞数" })
  @Index("idx_like_count")
  likeCount: number;

  @Column({
    name: "favorite_count",
    type: "int",
    default: 0,
    comment: "收藏数",
  })
  favoriteCount: number;

  @Column({
    name: "download_count",
    type: "int",
    default: 0,
    comment: "下载次数",
  })
  downloadCount: number;

  @Column({
    type: "tinyint",
    default: WallpaperStatus.PENDING,
    comment: "状态 0:待审核 1:已通过 2:已驳回",
  })
  @Index("idx_status")
  status: WallpaperStatus;

  @Column({
    name: "review_note",
    type: "varchar",
    length: 500,
    nullable: true,
    comment: "审核说明",
  })
  reviewNote: string | null;

  @Column({
    name: "reviewed_by",
    type: "bigint",
    nullable: true,
    comment: "审核管理员ID",
  })
  reviewedBy: number | null;

  @Column({
    name: "reviewed_at",
    type: "datetime",
    nullable: true,
    comment: "审核时间",
  })
  reviewedAt: Date | null;

  @Column({
    name: "is_featured",
    type: "boolean",
    default: false,
    comment: "是否推荐",
  })
  @Index("idx_is_featured")
  isFeatured: boolean;

  @CreateDateColumn({ name: "created_at", comment: "创建时间" })
  @Index("idx_created_at_desc")
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", comment: "更新时间" })
  updatedAt: Date;

  // 标签关联
  @ManyToMany(() => Tag, (tag) => tag.wallpapers)
  @JoinTable({
    name: "wallpaper_tags",
    joinColumn: { name: "wallpaper_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "tag_id", referencedColumnName: "id" },
  })
  tags: Tag[];

  @DeleteDateColumn({
    name: "deleted_at",
    nullable: true,
    comment: "删除时间（软删除）",
  })
  deletedAt: Date;
}
