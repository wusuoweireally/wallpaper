import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Collection } from "../entities/collection.entity";
import { CollectionWallpaper } from "../entities/collection-wallpaper.entity";
import { Wallpaper, WallpaperStatus } from "../entities/wallpaper.entity";
import { normalizePagination } from "../common/pagination";
import { sanitizeUser } from "../utils/sanitize";

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepo: Repository<Collection>,
    @InjectRepository(CollectionWallpaper)
    private readonly itemRepo: Repository<CollectionWallpaper>,
    @InjectRepository(Wallpaper)
    private readonly wallpaperRepo: Repository<Wallpaper>,
  ) {}

  async listByUser(userId: number): Promise<
    Array<
      Collection & {
        itemCount: number;
      }
    >
  > {
    const rows = await this.collectionRepo
      .createQueryBuilder("c")
      .loadRelationCountAndMap(
        "c.itemCount",
        "c.items",
        "item",
        // 只计公开壁纸，与 listItems 展示口径一致
        (qb) =>
          qb.innerJoin("item.wallpaper", "w", "w.status = :approved", {
            approved: WallpaperStatus.APPROVED,
          }),
      )
      .where("c.userId = :userId", { userId })
      .orderBy("c.updatedAt", "DESC")
      .getMany();

    return rows as Array<Collection & { itemCount: number }>;
  }

  async create(userId: number, name: string): Promise<Collection> {
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException("合集名称不能为空");

    const collection = this.collectionRepo.create({
      userId,
      name: trimmed,
    });
    return this.collectionRepo.save(collection);
  }

  async rename(
    userId: number,
    collectionId: number,
    name: string,
  ): Promise<Collection> {
    const collection = await this.requireOwned(userId, collectionId);
    const trimmed = name.trim();
    if (!trimmed) throw new BadRequestException("合集名称不能为空");
    collection.name = trimmed;
    return this.collectionRepo.save(collection);
  }

  async remove(userId: number, collectionId: number): Promise<void> {
    const collection = await this.requireOwned(userId, collectionId);
    await this.collectionRepo.remove(collection);
  }

  async addWallpaper(
    userId: number,
    collectionId: number,
    wallpaperId: number,
  ): Promise<CollectionWallpaper> {
    await this.requireOwned(userId, collectionId);
    const wallpaper = await this.wallpaperRepo.findOne({
      where: { id: wallpaperId, status: WallpaperStatus.APPROVED },
    });
    if (!wallpaper) throw new NotFoundException("壁纸不存在或未公开");

    const existing = await this.itemRepo.findOne({
      where: { collectionId, wallpaperId },
    });
    if (existing) return existing;

    try {
      // 增删项与合集行 updatedAt 同事务更新：列表按 updatedAt DESC 排序，
      // 不显式赋值的话关联表操作不会带动合集行，"最近操作的合集在前"会失效
      return await this.itemRepo.manager.transaction(async (manager) => {
        const saved = await manager.save(
          manager.create(CollectionWallpaper, { collectionId, wallpaperId }),
        );
        await manager.update(Collection, collectionId, {
          updatedAt: new Date(),
        });
        return saved;
      });
    } catch (err) {
      // 并发双击撞唯一键：按幂等处理返回已有记录
      if ((err as { code?: string }).code !== "ER_DUP_ENTRY") throw err;
      return this.itemRepo.findOneOrFail({
        where: { collectionId, wallpaperId },
      });
    }
  }

  async removeWallpaper(
    userId: number,
    collectionId: number,
    wallpaperId: number,
  ): Promise<void> {
    await this.requireOwned(userId, collectionId);
    await this.itemRepo.manager.transaction(async (manager) => {
      const result = await manager.delete(CollectionWallpaper, {
        collectionId,
        wallpaperId,
      });
      // 实际移除才刷新排序键，重复删除不产生假"最近操作"
      if (!result.affected) return;
      await manager.update(Collection, collectionId, {
        updatedAt: new Date(),
      });
    });
  }

  async listItems(
    collectionId: number,
    page = 1,
    limit = 20,
    /** 若提供则校验所有权 */
    ownerUserId?: number,
  ): Promise<{ data: Wallpaper[]; total: number; collection: Collection }> {
    ({ page, limit } = normalizePagination(page, limit));
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException("合集不存在");
    if (ownerUserId !== undefined && collection.userId !== ownerUserId) {
      throw new NotFoundException("合集不存在");
    }

    const qb = this.itemRepo
      .createQueryBuilder("item")
      .innerJoinAndSelect("item.wallpaper", "wallpaper")
      .leftJoinAndSelect("wallpaper.uploader", "uploader")
      .leftJoinAndSelect("wallpaper.tags", "tags")
      .where("item.collectionId = :collectionId", { collectionId })
      .andWhere("wallpaper.status = :status", {
        status: WallpaperStatus.APPROVED,
      })
      .orderBy("item.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    const data = items
      .map((i) => i.wallpaper)
      .filter(Boolean)
      .map((wp) => {
        if (!wp.uploader) return wp;
        return {
          ...wp,
          uploader: sanitizeUser(
            wp.uploader as unknown as Record<string, unknown>,
          ) as unknown as Wallpaper["uploader"],
        };
      });

    return { data, total, collection };
  }

  /** 该用户哪些合集已包含某壁纸（详情页下拉勾选态用） */
  async findIdsContaining(
    userId: number,
    wallpaperId: number,
  ): Promise<number[]> {
    const rows = await this.itemRepo.find({
      where: { wallpaperId },
      select: ["collectionId"],
    });
    if (rows.length === 0) return [];
    const owned = await this.collectionRepo.find({
      where: { userId },
      select: ["id"],
    });
    const ownedIds = new Set(owned.map((c) => c.id));
    return rows.map((r) => r.collectionId).filter((id) => ownedIds.has(id));
  }

  private async requireOwned(
    userId: number,
    collectionId: number,
  ): Promise<Collection> {
    const collection = await this.collectionRepo.findOne({
      where: { id: collectionId },
    });
    if (!collection) throw new NotFoundException("合集不存在");
    if (collection.userId !== userId) {
      throw new ForbiddenException("无权操作该合集");
    }
    return collection;
  }
}
