import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { UserLike } from "../entities/user-like.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { TagService } from "./tag.service";
import { WallpaperService } from "./wallpaper.service";

describe("WallpaperService.attachInteractionStatus", () => {
  const makeWallpaper = (id: number): Wallpaper =>
    Object.assign(new Wallpaper(), {
      id,
      status: 1,
      likeCount: 0,
      favoriteCount: 0,
    });

  const createService = (
    likeRows: Array<{ wallpaperId: number | string }>,
    favoriteRows: Array<{ wallpaperId: number | string }>,
  ) => {
    const likeQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(likeRows),
    };
    const favoriteQb = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(favoriteRows),
    };

    const userLikeRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(likeQb),
    };
    const userFavoriteRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(favoriteQb),
    };

    const service = new WallpaperService(
      {} as Repository<Wallpaper>,
      userLikeRepository as unknown as Repository<UserLike>,
      userFavoriteRepository as unknown as Repository<UserFavorite>,
      {} as DataSource,
      {} as TagService,
    );

    return { service, likeQb, favoriteQb, userLikeRepository };
  };

  it("returns explicit false flags when viewer is anonymous", async () => {
    const { service, userLikeRepository } = createService([], []);
    const wallpapers = [makeWallpaper(1), makeWallpaper(2)];

    const result = await service.attachInteractionStatus(wallpapers);

    expect(result).toEqual([
      expect.objectContaining({ id: 1, isLiked: false, isFavorited: false }),
      expect.objectContaining({ id: 2, isLiked: false, isFavorited: false }),
    ]);
    expect(userLikeRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("marks liked and favorited items for authenticated viewer", async () => {
    const { service, likeQb, favoriteQb } = createService(
      [{ wallpaperId: 10 }, { wallpaperId: "12" }],
      [{ wallpaperId: 12 }],
    );
    const wallpapers = [
      makeWallpaper(10),
      makeWallpaper(11),
      makeWallpaper(12),
    ];

    const result = await service.attachInteractionStatus(wallpapers, 7);

    expect(likeQb.where).toHaveBeenCalledWith("like.userId = :viewerId", {
      viewerId: 7,
    });
    expect(favoriteQb.where).toHaveBeenCalledWith(
      "favorite.userId = :viewerId",
      { viewerId: 7 },
    );
    expect(result).toEqual([
      expect.objectContaining({ id: 10, isLiked: true, isFavorited: false }),
      expect.objectContaining({ id: 11, isLiked: false, isFavorited: false }),
      expect.objectContaining({ id: 12, isLiked: true, isFavorited: true }),
    ]);
  });

  it("returns empty list unchanged for empty input", async () => {
    const { service, userLikeRepository } = createService([], []);

    await expect(service.attachInteractionStatus([], 3)).resolves.toEqual([]);
    expect(userLikeRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
