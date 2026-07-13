import { Table, TableIndex } from "typeorm";
import type { QueryRunner } from "typeorm";
import { AddWallpaperAssetIndexes1740000000000 } from "../migrations/AddWallpaperAssetIndexes1740000000000";

describe("AddWallpaperAssetIndexes1740000000000", () => {
  it("creates only missing named indexes (skips by index name)", async () => {
    const table = createTable([
      new TableIndex({
        name: "idx_wallpapers_thumbnail_url",
        columnNames: ["thumbnail_url"],
      }),
    ]);
    const queryRunner = createQueryRunner(table);

    await new AddWallpaperAssetIndexes1740000000000().up(queryRunner);

    expect(queryRunner.dropIndex).not.toHaveBeenCalled();
    expect(queryRunner.createIndex).toHaveBeenCalledTimes(1);
    expect(queryRunner.createIndex).toHaveBeenCalledWith(
      table,
      expect.objectContaining({
        name: "idx_wallpapers_file_url",
        columnNames: ["file_url"],
      }),
    );
  });

  it("is a no-op when both named indexes already exist", async () => {
    const table = createTable([
      new TableIndex({
        name: "idx_wallpapers_file_url",
        columnNames: ["file_url"],
      }),
      new TableIndex({
        name: "idx_wallpapers_thumbnail_url",
        columnNames: ["thumbnail_url"],
      }),
    ]);
    const queryRunner = createQueryRunner(table);

    await new AddWallpaperAssetIndexes1740000000000().up(queryRunner);

    expect(queryRunner.createIndex).not.toHaveBeenCalled();
    expect(queryRunner.dropIndex).not.toHaveBeenCalled();
  });

  it.each(["up", "down"] as const)(
    "%s remains idempotent when the wallpapers table is missing",
    async (method) => {
      const queryRunner = createQueryRunner(undefined, false);
      const migration = new AddWallpaperAssetIndexes1740000000000();

      await migration[method](queryRunner);
      await migration[method](queryRunner);

      expect(queryRunner.hasTable).toHaveBeenCalledTimes(2);
      expect(queryRunner.hasTable).toHaveBeenNthCalledWith(1, "wallpapers");
      expect(queryRunner.hasTable).toHaveBeenNthCalledWith(2, "wallpapers");
      expect(queryRunner.getTable).not.toHaveBeenCalled();
      expect(queryRunner.createIndex).not.toHaveBeenCalled();
      expect(queryRunner.dropIndex).not.toHaveBeenCalled();
    },
  );
});

type MockQueryRunner = QueryRunner & {
  hasTable: jest.Mock;
  getTable: jest.Mock;
  createIndex: jest.Mock;
  dropIndex: jest.Mock;
};

function createTable(indices: TableIndex[]): Table {
  return new Table({ name: "wallpapers", indices });
}

function createQueryRunner(table?: Table, hasTable = true): MockQueryRunner {
  return {
    hasTable: jest.fn().mockResolvedValue(hasTable),
    getTable: jest.fn().mockResolvedValue(table),
    createIndex: jest.fn().mockResolvedValue(undefined),
    dropIndex: jest.fn().mockResolvedValue(undefined),
  } as unknown as MockQueryRunner;
}
