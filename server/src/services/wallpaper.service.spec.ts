import { NotFoundException } from "@nestjs/common";
import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { UserLike } from "../entities/user-like.entity";
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
      {} as Repository<UserLike>,
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

  describe("findVisibleByAssetUrl", () => {
    it("allows anonymous access to an approved asset", async () => {
      const wallpaper = createWallpaper(1);
      findOne.mockResolvedValue(wallpaper);

      await expect(service.findVisibleByAssetUrl(assetUrl)).resolves.toBe(
        wallpaper,
      );
      expect(findOne).toHaveBeenCalledWith({
        where: { fileUrl: assetUrl },
      });
    });

    it("queries the thumbnail URL column directly", async () => {
      const wallpaper = createWallpaper(1);
      findOne.mockResolvedValue(wallpaper);

      await service.findVisibleByAssetUrl(wallpaper.thumbnailUrl);

      expect(findOne).toHaveBeenCalledWith({
        where: { thumbnailUrl: wallpaper.thumbnailUrl },
      });
    });

    it.each([
      ["anonymous", undefined],
      ["another user", { userId: uploaderId + 1, role: UserRole.USER }],
    ])("hides a pending asset from %s", async (_name, viewer) => {
      findOne.mockResolvedValue(createWallpaper(0));

      await expect(
        service.findVisibleByAssetUrl(assetUrl, viewer),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("allows the uploader to access a pending asset", async () => {
      const wallpaper = createWallpaper(0);
      findOne.mockResolvedValue(wallpaper);

      await expect(
        service.findVisibleByAssetUrl(assetUrl, {
          userId: uploaderId,
          role: UserRole.USER,
        }),
      ).resolves.toBe(wallpaper);
    });

    it.each([UserRole.ADMIN, UserRole.SUPER_ADMIN])(
      "allows a %s to access a pending asset",
      async (role) => {
        const wallpaper = createWallpaper(0);
        findOne.mockResolvedValue(wallpaper);

        await expect(
          service.findVisibleByAssetUrl(assetUrl, {
            userId: uploaderId + 1,
            role,
          }),
        ).resolves.toBe(wallpaper);
      },
    );

    it("returns 404 when the asset is not associated with a wallpaper", async () => {
      findOne.mockResolvedValue(null);

      await expect(
        service.findVisibleByAssetUrl(assetUrl),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});

describe("WallpaperService idempotent interactions", () => {
  const wallpaper = Object.assign(new Wallpaper(), {
    id: 42,
    status: 1,
    likeCount: 5,
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
    entity: typeof UserLike | typeof UserFavorite,
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
        (entity === UserLike
          ? interactionRepository
          : {}) as unknown as Repository<UserLike>,
        (entity === UserFavorite
          ? interactionRepository
          : {}) as unknown as Repository<UserFavorite>,
        dataSource as unknown as DataSource,
        {} as TagService,
      ),
      wallpaperRepository,
    };
  };

  it("does not toggle or recount an existing like", async () => {
    const likes = {
      findOne: jest.fn().mockResolvedValue({ id: 9 }),
      create: jest.fn(),
      save: jest.fn(),
    };
    const { service, wallpaperRepository } = createService(likes, UserLike);

    await expect(service.addLike(7, 42)).resolves.toEqual({
      isLiked: true,
      likeCount: 5,
    });
    expect(likes.save).not.toHaveBeenCalled();
    expect(wallpaperRepository.increment).not.toHaveBeenCalled();
  });

  it("does not toggle or recount an existing favorite", async () => {
    const favorites = {
      findOne: jest.fn().mockResolvedValue({ id: 11 }),
      create: jest.fn(),
      save: jest.fn(),
    };
    const { service, wallpaperRepository } = createService(
      favorites,
      UserFavorite,
    );

    await expect(service.addFavorite(7, 42)).resolves.toEqual({
      isFavorited: true,
      favoriteCount: 3,
    });
    expect(favorites.save).not.toHaveBeenCalled();
    expect(wallpaperRepository.increment).not.toHaveBeenCalled();
  });

  it("keeps the like count unchanged when removing an absent like", async () => {
    const remove = jest.fn().mockResolvedValue({ affected: 0 });
    const { service } = createService({}, UserLike, remove);

    await expect(service.removeLike(7, 42)).resolves.toEqual({
      isLiked: false,
      likeCount: 5,
    });
  });

  it("keeps the favorite count unchanged when removing an absent favorite", async () => {
    const remove = jest.fn().mockResolvedValue({ affected: 0 });
    const { service } = createService({}, UserFavorite, remove);

    await expect(service.removeFavorite(7, 42)).resolves.toEqual({
      isFavorited: false,
      favoriteCount: 3,
    });
  });
});
