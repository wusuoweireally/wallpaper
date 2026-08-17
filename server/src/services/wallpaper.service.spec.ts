import { BadRequestException, NotFoundException } from "@nestjs/common";
import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { UserRole } from "../entities/user.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { TagService } from "./tag.service";
import { WallpaperService } from "./wallpaper.service";

describe("WallpaperService visibility", () => {
  const wallpaperId = 42;
  const uploaderId = 7;
  const assetUrl = "/uploads/wallpapers/example.webp";

  let findOne: jest.MockedFunction<Repository<Wallpaper>["findOne"]>;
  let service: WallpaperService;

  const createWallpaper = (status: number): Wallpaper =>
    Object.assign(new Wallpaper(), {
      id: wallpaperId,
      fileUrl: assetUrl,
      thumbnailUrl: "/uploads/thumbnails/example.webp",
      uploaderId,
      status,
    });

  beforeEach(() => {
    findOne = jest.fn();
    service = new WallpaperService(
      { findOne } as unknown as Repository<Wallpaper>,
      {} as Repository<UserFavorite>,
      {} as DataSource,
      {} as TagService,
    );
  });

  describe("findVisibleById", () => {
    it("allows anonymous access to an approved wallpaper", async () => {
      const wallpaper = createWallpaper(1);
      findOne.mockResolvedValue(wallpaper);

      await expect(service.findVisibleById(wallpaperId)).resolves.toBe(
        wallpaper,
      );
      expect(findOne).toHaveBeenCalledWith({
        where: { id: wallpaperId },
        relations: ["uploader", "tags"],
      });
    });

    it.each([
      ["anonymous", undefined],
      ["another user", { userId: uploaderId + 1, role: UserRole.USER }],
    ])("hides a pending wallpaper from %s", async (_name, viewer) => {
      findOne.mockResolvedValue(createWallpaper(0));

      await expect(
        service.findVisibleById(wallpaperId, viewer),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("allows the uploader to access a pending wallpaper", async () => {
      const wallpaper = createWallpaper(0);
      findOne.mockResolvedValue(wallpaper);

      await expect(
        service.findVisibleById(wallpaperId, {
          userId: uploaderId,
          role: UserRole.USER,
        }),
      ).resolves.toBe(wallpaper);
    });

    it.each([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      "allows a %s to access a pending wallpaper",
      async (role) => {
        const wallpaper = createWallpaper(0);
        findOne.mockResolvedValue(wallpaper);

        await expect(
          service.findVisibleById(wallpaperId, {
            userId: uploaderId + 1,
            role,
          }),
        ).resolves.toBe(wallpaper);
      },
    );

    it("returns 404 when the wallpaper does not exist", async () => {
      findOne.mockResolvedValue(null);

      await expect(service.findVisibleById(wallpaperId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});

describe("WallpaperService idempotent interactions", () => {
  const wallpaper = Object.assign(new Wallpaper(), {
    id: 42,
    status: 1,
    favoriteCount: 3,
  });

  const createLockedWallpaperQuery = () => {
    const query = {
      setLock: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      getOne: jest.fn().mockResolvedValue(wallpaper),
    };
    Object.values(query).forEach((method) => {
      if (method !== query.getOne) method.mockReturnValue(query);
    });
    return query;
  };

  const createService = (
    interactionRepository: Record<string, jest.Mock>,
    managerDelete = jest.fn(),
  ) => {
    const lockedQuery = createLockedWallpaperQuery();
    const wallpaperRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(lockedQuery),
      increment: jest.fn(),
    };
    const getRepository = jest.fn((target: unknown) =>
      target === Wallpaper ? wallpaperRepository : interactionRepository,
    );
    const manager = {
      getRepository,
      delete: managerDelete,
    };
    const dataSource = {
      transaction: jest.fn(
        (callback: (transactionManager: typeof manager) => unknown) =>
          callback(manager),
      ),
    };

    return {
      service: new WallpaperService(
        {} as Repository<Wallpaper>,
        interactionRepository as unknown as Repository<UserFavorite>,
        dataSource as unknown as DataSource,
        {} as TagService,
      ),
      wallpaperRepository,
    };
  };

  it("does not toggle or recount an existing favorite", async () => {
    const favorites = {
      findOne: jest.fn().mockResolvedValue({ id: 11 }),
      create: jest.fn(),
      save: jest.fn(),
    };
    const { service, wallpaperRepository } = createService(favorites);

    await expect(service.addFavorite(7, 42)).resolves.toEqual({
      isFavorited: true,
      favoriteCount: 3,
    });
    expect(favorites.save).not.toHaveBeenCalled();
    expect(wallpaperRepository.increment).not.toHaveBeenCalled();
  });

  it("keeps the favorite count unchanged when removing an absent favorite", async () => {
    const remove = jest.fn().mockResolvedValue({ affected: 0 });
    const { service } = createService({}, remove);

    await expect(service.removeFavorite(7, 42)).resolves.toEqual({
      isFavorited: false,
      favoriteCount: 3,
    });
  });
});

describe("WallpaperService status transitions (update status)", () => {
  const id = 42;

  /** 组装可跑 setStatus 事务的 service：锁行查询返回指定状态的壁纸 */
  const createService = (lockedStatus: number) => {
    const wallpaper = Object.assign(new Wallpaper(), {
      id,
      status: lockedStatus,
    });
    const lockedQuery = {
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(wallpaper),
    };
    const tagUpdate = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    const manager = {
      getRepository: jest.fn((target: unknown) =>
        target === Wallpaper
          ? { createQueryBuilder: () => lockedQuery }
          : { createQueryBuilder: () => tagUpdate },
      ),
      count: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
    };
    const dataSource = {
      transaction: jest.fn((callback: (m: typeof manager) => unknown) =>
        callback(manager),
      ),
    };
    return {
      service: new WallpaperService(
        {
          findOne: jest.fn().mockResolvedValue(wallpaper),
        } as unknown as Repository<Wallpaper>,
        {} as Repository<UserFavorite>,
        dataSource as unknown as DataSource,
        {} as TagService,
      ),
      manager,
      tagUpdate,
    };
  };

  it("rejects publishing a draft without tags (bypassing publishDrafts)", async () => {
    const { service, manager } = createService(0);
    manager.count.mockResolvedValue(0);

    await expect(service.update(id, { status: 1 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(manager.update).not.toHaveBeenCalled();
  });

  it("publishes with tags and increments tag usage", async () => {
    const { service, manager, tagUpdate } = createService(0);
    manager.count.mockResolvedValue(2);
    manager.find.mockResolvedValue([{ tagId: 5 }, { tagId: 9 }]);

    await expect(service.update(id, { status: 1 })).resolves.not.toThrow();
    expect(manager.update).toHaveBeenCalledWith(
      Wallpaper,
      id,
      expect.objectContaining({ status: 1 }),
    );
    expect(tagUpdate.set).toHaveBeenCalledWith(
      expect.objectContaining({ usageCount: expect.any(Function) }),
    );
  });

  it("unpublishing decrements tag usage", async () => {
    const { service, manager, tagUpdate } = createService(1);
    manager.find.mockResolvedValue([{ tagId: 5 }]);

    await expect(service.update(id, { status: 0 })).resolves.not.toThrow();
    expect(manager.update).toHaveBeenCalledWith(
      Wallpaper,
      id,
      expect.objectContaining({ status: 0 }),
    );
    expect(tagUpdate.execute).toHaveBeenCalled();
  });

  it("no-ops when status is unchanged", async () => {
    const { service, manager } = createService(1);

    await expect(service.update(id, { status: 1 })).resolves.not.toThrow();
    expect(manager.update).not.toHaveBeenCalled();
  });
});
