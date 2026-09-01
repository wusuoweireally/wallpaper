import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { TagService } from "./tag.service";
import { WallpaperService } from "./wallpaper.service";
import { matchesWallpaperFilters } from "./wallpaper-filters";

/**
 * 验证 findAll 会把筛选语义落到 QueryBuilder，
 * 并用 shipped matchesWallpaperFilters 对 fixture 断言结果集正确性。
 */
describe("WallpaperService.findAll filter application", () => {
  const fixtures = [
    Object.assign(new Wallpaper(), {
      id: 1,
      width: 1920,
      height: 1080,
      aspectRatio: 1.78,
      category: "general",
      colorBucket: "blue",
      status: 1,
      createdAt: new Date("2026-08-10"),
      tags: [{ name: "sky" }, { name: "ocean" }],
    }),
    Object.assign(new Wallpaper(), {
      id: 2,
      width: 3840,
      height: 2160,
      aspectRatio: 1.78,
      category: "anime",
      colorBucket: "red",
      status: 1,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 天内
      tags: [{ name: "city" }],
    }),
  ];

  const createFindAllService = (
    filterFn: (rows: Wallpaper[]) => Wallpaper[],
  ) => {
    const andWheres: Array<{ sql: string; params?: object }> = [];
    // 显式注解:属性回调里引用 qb 自身,无注解会被 TS 循环推断成 any
    const qb: Record<string, jest.Mock> = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn((sql: string, params?: object) => {
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
        const filtered = filterFn(fixtures);
        return [filtered, filtered.length];
      }),
    };

    const wallpaperRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    };

    const service = new WallpaperService(
      wallpaperRepository as unknown as Repository<Wallpaper>,
      {} as Repository<UserFavorite>,
      {} as DataSource,
      {} as TagService,
    );

    return { service, qb, andWheres };
  };

  it("applies min resolution + color + topRange via query path", async () => {
    const criteria = {
      minWidth: 3000,
      minHeight: 1600,
      color: "red",
      topRange: "1M" as const,
    };
    const { service, andWheres } = createFindAllService((rows) =>
      rows.filter((wp) =>
        matchesWallpaperFilters(
          {
            width: wp.width,
            height: wp.height,
            aspectRatio: wp.aspectRatio,
            category: wp.category,
            colorBucket: wp.colorBucket,
            createdAt: wp.createdAt,
            tagNames: (wp.tags || []).map((t: { name: string }) => t.name),
            status: wp.status,
          },
          { ...criteria, now: Date.now() },
        ),
      ),
    );

    const result = await service.findAll({
      page: 1,
      limit: 20,
      minWidth: 3000,
      minHeight: 1600,
      color: "red",
      topRange: "1M",
    });

    expect(andWheres.some((w) => w.sql.includes("width >="))).toBe(true);
    expect(andWheres.some((w) => w.sql.includes("height >="))).toBe(true);
    expect(andWheres.some((w) => w.sql.includes("colorBucket"))).toBe(true);
    expect(andWheres.some((w) => w.sql.includes("createdAt >="))).toBe(true);

    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe(2);
    expect(result.data[0].width).toBeGreaterThanOrEqual(3000);
    expect(result.data[0].colorBucket).toBe("red");
  });

  it("applies exact resolution + aspect ratio + multi-tag", async () => {
    const { service, andWheres, qb } = createFindAllService((rows) =>
      rows.filter((wp) =>
        matchesWallpaperFilters(
          {
            width: wp.width,
            height: wp.height,
            aspectRatio: wp.aspectRatio,
            tagNames: (wp.tags || []).map((t: { name: string }) => t.name),
            status: wp.status,
          },
          {
            resolutions: ["1920x1080"],
            aspectRatio: 16 / 9,
            tags: ["sky", "ocean"],
          },
        ),
      ),
    );

    const result = await service.findAll({
      resolutions: ["1920x1080"],
      aspectRatio: 16 / 9,
      tags: ["sky", "ocean"],
    });

    expect(andWheres.some((w) => String(w.sql).includes("resW"))).toBe(true);
    expect(andWheres.some((w) => w.sql.includes("aspectRatio"))).toBe(true);
    // multi-tag 走 EXISTS 子查询（非 groupBy/having）
    const tagWheres = andWheres.filter((w) =>
      String(w.sql).toUpperCase().includes("EXISTS"),
    );
    expect(tagWheres.length).toBe(2); // sky + ocean 各一条
    expect(qb.innerJoin).not.toHaveBeenCalled();
    expect(qb.having).not.toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.data[0].id).toBe(1);
  });

  it("applies tag-name keyword search via EXISTS LIKE", async () => {
    const { service, andWheres } = createFindAllService((rows) =>
      rows.filter((wp) =>
        (wp.tags || []).some((t: { name: string }) => t.name.includes("c")),
      ),
    );

    const result = await service.findAll({ search: "c" });

    const searchWhere = andWheres.find((w) =>
      String(w.sql).toUpperCase().includes("LIKE"),
    );
    expect(searchWhere).toBeDefined();
    expect(searchWhere?.params).toEqual({ search: "%c%" });
    expect(result.total).toBe(2);
  });
});
