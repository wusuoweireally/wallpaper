import type { DataSource, Repository } from "typeorm";
import { UserFavorite } from "../entities/user-favorite.entity";
import { Tag } from "../entities/tag.entity";
import { Wallpaper } from "../entities/wallpaper.entity";
import { WallpaperTag } from "../entities/wallpaper-tag.entity";
import { TagService } from "./tag.service";
import { WallpaperService } from "./wallpaper.service";

/**
 * usageCount 记账不变量：净增减必须等于「曾被计入的关联数」的真实变化。
 * 覆盖发布换标签的两条路径：
 * a) 草稿期预挂标签从未计数（attachWallpaperTags 仅对 APPROVED +1），
 *    发布时换成别的标签不得按已公开口径误扣原标签；
 * b) 已公开壁纸正常换标签，移除 -1 / 新增 +1 对称。
 */
describe("WallpaperService publishDrafts tag accounting", () => {
  const WALLPAPER_ID = 42;
  const UPLOADER_ID = 7;
  const SKY_ID = 11;
  const MOON_ID = 22;
  const SLUG_IDS: Record<string, number> = { sky: SKY_ID, moon: MOON_ID };

  /** 运行时 criteria 可能是 In([...])，从 FindOperator.value 取回数组 */
  const unwrapIds = (raw: unknown): number[] => {
    if (Array.isArray(raw)) return raw.map(Number);
    const value = (raw as { value?: number[] }).value;
    return Array.isArray(value) ? value.map(Number) : [];
  };

  /**
   * 组装带响应式内存库的 service：manager.update / 关联表增删实时回写 db，
   * usageCount 变更统一落进 counts 并记录事件，便于对记账口径做断言
   */
  const createHarness = (init: {
    status: number;
    /** 壁纸现有标签关联（wallpaper_tags） */
    links: number[];
    /** 标签 usageCount 基线 */
    counts: Record<number, number>;
  }) => {
    const db = {
      wallpaper: { status: init.status },
      links: [...init.links],
      counts: { ...init.counts },
    };
    /** 每一条 usageCount 变更记录，用于断言记账路径本身 */
    const events: string[] = [];

    const applyUsageDelta = (ids: number[], expr: string) => {
      const delta = expr.includes("GREATEST") ? -1 : 1;
      ids.forEach((id) => {
        db.counts[id] = Math.max(0, (db.counts[id] ?? 0) + delta);
      });
      events.push(`${expr} -> [${ids.join(",")}]`);
    };

    // 每条 QueryBuilder 链独立保存自己的 where 参数与 set 表达式
    const createChainQb = () => {
      const scope = {
        whereIds: [] as number[],
        setter: undefined as { usageCount?: () => string } | undefined,
      };
      const execute = jest.fn(() => {
        const expr = scope.setter?.usageCount?.();
        if (expr) applyUsageDelta(scope.whereIds, expr);
        return Promise.resolve();
      });
      const qb = {
        setLock: jest.fn(),
        orderBy: jest.fn(),
        update: jest.fn(),
        where: jest.fn((_sql: string, params?: Record<string, unknown>) => {
          const candidates = params as {
            tagIds?: number[];
            removedIds?: number[];
            ids?: number[];
          };
          if (Array.isArray(candidates?.ids))
            scope.whereIds = candidates.ids.map(Number);
          if (Array.isArray(candidates?.tagIds))
            scope.whereIds = candidates.tagIds.map(Number);
          if (Array.isArray(candidates?.removedIds))
            scope.whereIds = candidates.removedIds.map(Number);
          return qb;
        }),
        set: jest.fn((payload: { usageCount?: () => string }) => {
          scope.setter = payload;
          return qb;
        }),
        execute,
        getOne: jest.fn(() => Promise.resolve({ ...db.wallpaper })),
        getMany: jest.fn(() => Promise.resolve([])),
      };
      [qb.setLock, qb.orderBy, qb.update].forEach((fn) =>
        fn.mockReturnValue(qb),
      );
      return qb;
    };

    const makeWpTagRepo = () => ({
      find: jest.fn(() =>
        Promise.resolve(
          db.links.map((tagId) => ({ wallpaperId: WALLPAPER_ID, tagId })),
        ),
      ),
      delete: jest.fn(({ tagId }: { tagId: unknown }) => {
        db.links = db.links.filter((id) => !unwrapIds(tagId).includes(id));
        return Promise.resolve();
      }),
      insert: jest.fn((rows: Array<{ tagId: number }>) => {
        rows.forEach(({ tagId }) => db.links.push(Number(tagId)));
        return Promise.resolve();
      }),
    });

    const makeTagRepo = () => ({
      findOne: jest.fn(({ where }: { where: { slug: string } }) =>
        Promise.resolve(
          SLUG_IDS[where.slug] === undefined
            ? null
            : ({ id: SLUG_IDS[where.slug], slug: where.slug } as Tag),
        ),
      ),
      increment: jest.fn(
        (criteria: { id: unknown }, _field: string, delta: number) => {
          unwrapIds(criteria.id).forEach((id) => {
            db.counts[id] = (db.counts[id] ?? 0) + delta;
            events.push(`increment(${delta}) -> ${id}`);
          });
          return Promise.resolve();
        },
      ),
      createQueryBuilder: createChainQb,
    });

    const manager = {
      update: jest.fn(
        (target: unknown, _criteria: unknown, patch: Partial<Wallpaper>) => {
          if (target === Wallpaper) Object.assign(db.wallpaper, patch);
          return Promise.resolve();
        },
      ),
      find: jest.fn(() =>
        Promise.resolve(db.links.map((tagId) => ({ tagId }))),
      ),
      count: jest.fn(() => Promise.resolve(db.links.length)),
      getRepository: jest.fn(
        (target: unknown) =>
          target === Wallpaper
            ? { createQueryBuilder: createChainQb }
            : target === Tag
              ? makeTagRepo()
              : makeWpTagRepo(), // WallpaperTag 兜底分支
      ),
    };
    const transaction = (cb: (m: typeof manager) => unknown) =>
      Promise.resolve(cb(manager));

    const tagService = new TagService(
      {} as Repository<Tag>,
      {} as Repository<WallpaperTag>,
      { transaction } as unknown as DataSource,
    );
    const service = new WallpaperService(
      {
        // publishDrafts 前后各 findById 一次：读实时快照供所有权/状态校验
        findOne: jest.fn(() =>
          Promise.resolve({
            id: WALLPAPER_ID,
            uploaderId: UPLOADER_ID,
            status: db.wallpaper.status,
          }),
        ),
      } as unknown as Repository<Wallpaper>,
      {} as Repository<UserFavorite>,
      { transaction } as unknown as DataSource,
      tagService,
    );

    return { service, tagService, db, events };
  };

  it("(a) 草稿预挂标签后发布换标签：原未计数的草稿标签不被误扣", async () => {
    // sky 基线 1 来自另一张已公开壁纸；本张草稿预挂 sky 时从未计数
    const { service, db, events } = createHarness({
      status: 0,
      links: [SKY_ID],
      counts: { [SKY_ID]: 1, [MOON_ID]: 0 },
    });

    await service.publishDrafts(UPLOADER_ID, [
      { id: WALLPAPER_ID, category: "general", tags: ["moon"] },
    ]);

    expect(events.filter((e) => e.includes("GREATEST"))).toEqual([]);
    expect(db.counts[SKY_ID]).toBe(1); // sky 不受影响
    expect(db.counts[MOON_ID]).toBe(1); // moon 随发布恰好 +1
  });

  it("(b) 已公开壁纸正常换标签：移除 -1 与新增 +1 对称", async () => {
    const { tagService, db, events } = createHarness({
      status: 1,
      links: [SKY_ID],
      counts: { [SKY_ID]: 1, [MOON_ID]: 0 },
    });

    await tagService.replaceWallpaperTags(WALLPAPER_ID, ["moon"]);

    expect(events.filter((e) => e.includes("GREATEST"))).toHaveLength(1);
    expect(db.counts[SKY_ID]).toBe(0); // 被移除且此前已计数，-1
    expect(db.counts[MOON_ID]).toBe(1); // 新增 +1
  });
});
