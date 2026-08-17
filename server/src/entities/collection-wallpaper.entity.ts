import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Collection } from "./collection.entity";
import { Wallpaper } from "./wallpaper.entity";

@Entity("collection_wallpapers")
@Index("uk_collection_wallpaper", ["collectionId", "wallpaperId"], {
  unique: true,
})
export class CollectionWallpaper {
  @PrimaryGeneratedColumn({ type: "bigint", comment: "ID" })
  id: number;

  @Column({ name: "collection_id", type: "bigint", comment: "合集ID" })
  collectionId: number;

  @Column({ name: "wallpaper_id", type: "bigint", comment: "壁纸ID" })
  @Index("idx_cw_wallpaper")
  wallpaperId: number;

  @ManyToOne(() => Collection, (c) => c.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "collection_id" })
  collection: Collection;

  @ManyToOne(() => Wallpaper, { onDelete: "CASCADE" })
  @JoinColumn({ name: "wallpaper_id" })
  wallpaper: Wallpaper;

  @CreateDateColumn({ name: "created_at", comment: "加入时间" })
  createdAt: Date;
}
