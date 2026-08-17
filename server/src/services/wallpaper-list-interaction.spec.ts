import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { TagService } from "./tag.service";
import { WallpaperService } from "./wallpaper.service";

describe("WallpaperService.attachInteractionStatus", () => {
  const makeWallpaper = (id: number): Wallpaper =>
    Object.assign(new Wallpaper(), {
      id,
      status: 1,
      favoriteCount: 0,
    });

  const createService = (
    favoriteRows: Array<{ wallpaperId: number | string }>,
  ) => {
    const favoriteQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(favoriteRows),
    };

    const userFavoriteRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(favoriteQb),
    };

    const service = new WallpaperService(
      {} as Repository<Wallpaper>,
      userFavoriteRepository as unknown as Repository<UserFavorite>,
      {} as DataSource,
      {} as TagService,
    );

    return { service, favoriteQb, userFavoriteRepository };
  };

  it("returns explicit false flags when viewer is anonymous", async () => {
    const { service, userFavoriteRepository } = createService([]);
    const wallpapers = [makeWallpaper(1), makeWallpaper(2)];

    const result = await service.attachInteractionStatus(wallpapers);

    expect(result).toEqual([
      expect.objectContaining({ id: 1, isFavorited: false }),
      expect.objectContaining({ id: 2, isFavorited: false }),
    ]);
    expect(userFavoriteRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("marks favorited items for authenticated viewer", async () => {
    const { service, favoriteQb } = createService([
      { wallpaperId: 12 },
      { wallpaperId: "13" },
    ]);
    const wallpapers = [
      makeWallpaper(11),
      makeWallpaper(12),
      makeWallpaper(13),
    ];

    const result = await service.attachInteractionStatus(wallpapers, 7);

    expect(favoriteQb.where).toHaveBeenCalledWith(
      "favorite.userId = :viewerId",
      { viewerId: 7 },
    );
    expect(result).toEqual([
      expect.objectContaining({ id: 11, isFavorited: false }),
      expect.objectContaining({ id: 12, isFavorited: true }),
      expect.objectContaining({ id: 13, isFavorited: true }),
    ]);
  });

  it("returns empty list unchanged for empty input", async () => {
    const { service, userFavoriteRepository } = createService([]);

    await expect(service.attachInteractionStatus([], 3)).resolves.toEqual([]);
    expect(userFavoriteRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
