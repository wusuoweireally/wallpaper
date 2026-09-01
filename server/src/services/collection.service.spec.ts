import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { Repository } from "typeorm";
import { Collection } from "../entities/collection.entity";
import { CollectionWallpaper } from "../entities/collection-wallpaper.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { CollectionService } from "./collection.service";

describe("CollectionService", () => {
  const userId = 9;
  const otherUser = 99;

  const createService = (opts: {
    collections?: Collection[];
    items?: CollectionWallpaper[];
    wallpapers?: Wallpaper[];
  }) => {
    const collections = opts.collections ?? [];
    const items = opts.items ?? [];
    const wallpapers = opts.wallpapers ?? [];

    const collectionRepo = {
      create: jest.fn((data: Partial<Collection>) =>
        Object.assign(new Collection(), { id: 1, ...data }),
      ),
      save: jest.fn((c: Collection) => c),
      findOne: jest.fn(({ where }: { where: { id: number } }) =>
        collections.find((c) => Number(c.id) === Number(where.id)),
      ),
      remove: jest.fn(() => undefined),
      createQueryBuilder: jest.fn(() => {
        const qb = {
          loadRelationCountAndMap: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          getMany: jest
            .fn()
            .mockResolvedValue(
              collections.filter((c) => Number(c.userId) === userId),
            ),
        };
        return qb;
      }),
    };

    const itemRepo = {
      findOne: jest.fn(
        ({ where }: { where: { collectionId: number; wallpaperId: number } }) =>
          items.find(
            (i) =>
              Number(i.collectionId) === Number(where.collectionId) &&
              Number(i.wallpaperId) === Number(where.wallpaperId),
          ),
      ),
      // 兼容两种调用：repo.create(data) 与 manager.create(Entity, data)
      create: jest.fn(
        (targetOrData: unknown, maybeData?: Partial<CollectionWallpaper>) =>
          Object.assign(new CollectionWallpaper(), {
            id: 10,
            ...(maybeData ?? (targetOrData as Partial<CollectionWallpaper>)),
          }),
      ),
      save: jest.fn((row: CollectionWallpaper) => {
        items.push(row);
        return row;
      }),
      // 兼容两种调用：repo.delete(where) 与 manager.delete(Entity, where)
      delete: jest.fn((targetOrWhere: unknown, maybeWhere?: unknown) => {
        const where = (maybeWhere ?? targetOrWhere) as {
          collectionId: number;
          wallpaperId: number;
        };
        const idx = items.findIndex(
          (i) =>
            Number(i.collectionId) === Number(where.collectionId) &&
            Number(i.wallpaperId) === Number(where.wallpaperId),
        );
        if (idx >= 0) items.splice(idx, 1);
        return { affected: idx >= 0 ? 1 : 0 };
      }),
      createQueryBuilder: jest.fn(() => {
        const chain = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([
            items
              .filter((i) => Number(i.collectionId) === 1)
              .map((i) => ({
                ...i,
                wallpaper: wallpapers.find(
                  (w) => Number(w.id) === Number(i.wallpaperId),
                ),
              })),
            items.filter((i) => Number(i.collectionId) === 1).length,
          ]),
        };
        return chain;
      }),
    };

    // 增删项走 itemRepo.manager.transaction 顺带刷新合集 updatedAt；
    // 事务内管理器复用同一份 items 数据，collectionUpdate 记录排序键刷新调用
    const collectionUpdate = jest.fn(() => Promise.resolve());
    const txManager = {
      create: itemRepo.create,
      save: itemRepo.save,
      delete: itemRepo.delete,
      update: collectionUpdate,
    };
    Object.assign(itemRepo, {
      manager: {
        transaction: jest.fn((cb: (m: typeof txManager) => unknown) =>
          Promise.resolve(cb(txManager)),
        ),
      },
    });

    const wallpaperRepo = {
      findOne: jest.fn(({ where }: { where: { id: number; status: number } }) =>
        wallpapers.find(
          (w) =>
            Number(w.id) === Number(where.id) &&
            Number(w.status) === Number(where.status),
        ),
      ),
    };

    const service = new CollectionService(
      collectionRepo as unknown as Repository<Collection>,
      itemRepo as unknown as Repository<CollectionWallpaper>,
      wallpaperRepo as unknown as Repository<Wallpaper>,
    );

    return {
      service,
      collectionRepo,
      itemRepo,
      wallpaperRepo,
      items,
      collectionUpdate,
    };
  };

  it("creates a named collection for user", async () => {
    const { service, collectionRepo } = createService({});
    const col = await service.create(userId, "  Neon  ");
    expect(col.name).toBe("Neon");
    expect(col.userId).toBe(userId);
    expect(collectionRepo.save).toHaveBeenCalled();
  });

  it("rejects empty collection name", async () => {
    const { service } = createService({});
    await expect(service.create(userId, "   ")).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("adds and removes wallpaper membership", async () => {
    const collection = Object.assign(new Collection(), {
      id: 1,
      userId,
      name: "Favs",
    });
    const wallpaper = Object.assign(new Wallpaper(), {
      id: 42,
      status: 1,
    });
    const { service, items, collectionUpdate } = createService({
      collections: [collection],
      wallpapers: [wallpaper],
      items: [],
    });

    // expect.any 返回 any,断言为 Date 消除 unsafe-assignment
    const anyUpdatedAt = expect.any(Date) as Date;
    const added = await service.addWallpaper(userId, 1, 42);
    expect(added.wallpaperId).toBe(42);
    expect(items).toHaveLength(1);
    // 实际增删会刷新合集 updatedAt（列表按 updatedAt DESC 排序）
    expect(collectionUpdate).toHaveBeenCalledWith(Collection, 1, {
      updatedAt: anyUpdatedAt,
    });
    collectionUpdate.mockClear();

    // idempotent add：未发生真实增删，不刷新排序键
    const again = await service.addWallpaper(userId, 1, 42);
    expect(again.wallpaperId).toBe(42);
    expect(items).toHaveLength(1);
    expect(collectionUpdate).not.toHaveBeenCalled();

    await service.removeWallpaper(userId, 1, 42);
    expect(items).toHaveLength(0);
    expect(collectionUpdate).toHaveBeenCalledWith(Collection, 1, {
      updatedAt: anyUpdatedAt,
    });
    collectionUpdate.mockClear();

    // 重复删除：affected=0，不刷新排序键
    await service.removeWallpaper(userId, 1, 42);
    expect(items).toHaveLength(0);
    expect(collectionUpdate).not.toHaveBeenCalled();
  });

  it("forbids mutating another user's collection", async () => {
    const collection = Object.assign(new Collection(), {
      id: 1,
      userId: otherUser,
      name: "Secret",
    });
    const { service } = createService({ collections: [collection] });
    await expect(service.remove(userId, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("lists collections for user", async () => {
    const collections = [
      Object.assign(new Collection(), {
        id: 1,
        userId,
        name: "A",
      }),
      Object.assign(new Collection(), {
        id: 2,
        userId,
        name: "B",
      }),
    ];
    const { service } = createService({ collections });
    const list = await service.listByUser(userId);
    expect(list).toHaveLength(2);
  });

  it("lists items for owned collection", async () => {
    const collection = Object.assign(new Collection(), {
      id: 1,
      userId,
      name: "A",
    });
    const wallpaper = Object.assign(new Wallpaper(), {
      id: 7,
      status: 1,
      fileUrl: "/x.png",
    });
    const item = Object.assign(new CollectionWallpaper(), {
      id: 1,
      collectionId: 1,
      wallpaperId: 7,
    });
    const { service } = createService({
      collections: [collection],
      wallpapers: [wallpaper],
      items: [item],
    });

    const result = await service.listItems(1, 1, 20, userId);
    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe(7);
    expect(result.collection.name).toBe("A");
  });
});
