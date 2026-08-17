import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { TagService } from "./tag.service";
import { WallpaperService } from "./wallpaper.service";

/**
 * 公开用户页只暴露上传；收藏走登录用户自己的 /users/favorites。
 */
describe("WallpaperService public user listings", () => {
  const ownerId = 42;
  const otherId = 99;

  const makeWp = (partial: Partial<Wallpaper> & { id: number }) =>
    Object.assign(new Wallpaper(), {
      status: 1,
      uploaderId: ownerId,
      width: 1920,
      height: 1080,
      fileUrl: `/w/${partial.id}.png`,
      ...partial,
    });

  describe("findPublicUploadsByUser", () => {
    it("returns only approved wallpapers for that uploader", async () => {
      const ownedApproved = makeWp({ id: 1, uploaderId: ownerId, status: 1 });
      const ownedPending = makeWp({ id: 2, uploaderId: ownerId, status: 0 });
      const otherApproved = makeWp({ id: 3, uploaderId: otherId, status: 1 });

      const andWheres: Array<{
        sql: string;
        params?: Record<string, unknown>;
      }> = [];
      const qb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn((sql: string, params?: Record<string, unknown>) => {
          andWheres.push({ sql, params });
          return qb;
        }),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        having: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(() => {
          // 模拟 findAll：status=1 + uploaderId 过滤
          const hasUploader = andWheres.some(
            (w) =>
              w.sql.includes("uploaderId") &&
              Number(w.params?.uploaderId) === ownerId,
          );
          const rows = [ownedApproved, ownedPending, otherApproved].filter(
            (w) =>
              Number(w.status) === 1 &&
              (!hasUploader || Number(w.uploaderId) === ownerId),
          );
          return [rows, rows.length];
        }),
      };

      const service = new WallpaperService(
        {
          createQueryBuilder: jest.fn().mockReturnValue(qb),
        } as unknown as Repository<Wallpaper>,
        {} as Repository<UserFavorite>,
        {} as DataSource,
        {} as TagService,
      );

      const result = await service.findPublicUploadsByUser(ownerId, 1, 20);

      expect(
        andWheres.some(
          (w) =>
            w.sql.includes("uploaderId") &&
            Number(w.params?.uploaderId) === ownerId,
        ),
      ).toBe(true);
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].uploaderId).toBe(ownerId);
      expect(result.data.every((w) => Number(w.status) === 1)).toBe(true);
    });
  });

  describe("getUserFavoritedWallpapers (owner favorites)", () => {
    it("returns only approved favorites belonging to that user", async () => {
      const favApproved = {
        wallpaper: makeWp({ id: 10, status: 1 }),
      };
      const favPending = {
        wallpaper: makeWp({ id: 11, status: 0 }),
      };

      const favoriteQb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          // 服务层 where 已限制 status=1；此处只返回已审核
          [favApproved],
          1,
        ]),
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

      const result = await service.getUserFavoritedWallpapers(ownerId, 1, 20);

      expect(favoriteQb.where).toHaveBeenCalledWith(
        "favorite.userId = :userId",
        { userId: ownerId },
      );
      expect(favoriteQb.andWhere).toHaveBeenCalledWith(
        "wallpaper.status = :status",
        { status: 1 },
      );
      expect(result.total).toBe(1);
      expect(result.data.map((w) => w.id)).toEqual([10]);
      expect(
        (result.data[0] as Wallpaper & { isFavorited?: boolean }).isFavorited,
      ).toBe(true);
      expect(result.data.every((w) => Number(w.status) === 1)).toBe(true);
      // pending 不应出现在结果中
      expect(result.data.find((w) => w.id === 11)).toBeUndefined();
      void favPending;
    });
  });
});
