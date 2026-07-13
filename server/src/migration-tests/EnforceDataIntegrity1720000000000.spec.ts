import { QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";
import { EnforceDataIntegrity1720000000000 } from "../migrations/EnforceDataIntegrity1720000000000";

describe("EnforceDataIntegrity1720000000000 users.id", () => {
  const alterUserId =
    "ALTER TABLE users MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT";

  it("does not alter or inspect foreign keys when users.id is generated", async () => {
    const queryRunner = createQueryRunner(true);

    await new EnforceDataIntegrity1720000000000().up(queryRunner);

    expect(queryRunner.getTables).not.toHaveBeenCalled();
    expect(queryRunner.dropForeignKey).not.toHaveBeenCalled();
    expect(queryRunner.createForeignKey).not.toHaveBeenCalled();
    expect(queryRunner.query).not.toHaveBeenCalledWith(alterUserId);
  });

  it("temporarily removes every foreign key referencing users.id", async () => {
    const first = createReference("wallpapers", "fk_wallpapers_uploader");
    const second = createReference("posts", "fk_posts_author");
    const unrelated = createReference("comments", "fk_comments_post", "posts");
    const queryRunner = createQueryRunner(false, [first, second, unrelated]);

    await new EnforceDataIntegrity1720000000000().up(queryRunner);

    expect(queryRunner.dropForeignKey).toHaveBeenCalledTimes(2);
    expect(queryRunner.dropForeignKey).toHaveBeenNthCalledWith(
      1,
      first.name,
      expect.objectContaining({ name: "fk_wallpapers_uploader" }),
    );
    expect(queryRunner.dropForeignKey).toHaveBeenNthCalledWith(
      2,
      second.name,
      expect.objectContaining({ name: "fk_posts_author" }),
    );
    expect(queryRunner.query).toHaveBeenCalledWith(alterUserId);
    expect(queryRunner.createForeignKey).toHaveBeenCalledTimes(2);
    expect(queryRunner.createForeignKey).toHaveBeenNthCalledWith(
      1,
      first.name,
      expect.objectContaining({ name: "fk_wallpapers_uploader" }),
    );
    expect(queryRunner.createForeignKey).toHaveBeenNthCalledWith(
      2,
      second.name,
      expect.objectContaining({ name: "fk_posts_author" }),
    );
  });

  it("restores all dropped foreign keys and preserves the alter error", async () => {
    const first = createReference("wallpapers", "fk_wallpapers_uploader");
    const second = createReference("posts", "fk_posts_author");
    const alterError = new Error("alter failed");
    const restoreError = new Error("restore failed");
    const queryRunner = createQueryRunner(false, [first, second]);
    queryRunner.query.mockImplementation((sql: string) =>
      sql === alterUserId ? Promise.reject(alterError) : Promise.resolve(),
    );
    queryRunner.createForeignKey
      .mockRejectedValueOnce(restoreError)
      .mockResolvedValueOnce(undefined);

    await expect(
      new EnforceDataIntegrity1720000000000().up(queryRunner),
    ).rejects.toBe(alterError);

    expect(queryRunner.createForeignKey).toHaveBeenCalledTimes(2);
  });

  it("restores already dropped foreign keys when a later drop fails", async () => {
    const first = createReference("wallpapers", "fk_wallpapers_uploader");
    const second = createReference("posts", "fk_posts_author");
    const dropError = new Error("drop failed");
    const queryRunner = createQueryRunner(false, [first, second]);
    queryRunner.dropForeignKey
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(dropError);

    await expect(
      new EnforceDataIntegrity1720000000000().up(queryRunner),
    ).rejects.toBe(dropError);

    expect(queryRunner.query).not.toHaveBeenCalledWith(alterUserId);
    expect(queryRunner.createForeignKey).toHaveBeenCalledTimes(1);
    expect(queryRunner.createForeignKey).toHaveBeenCalledWith(
      first.name,
      expect.objectContaining({ name: "fk_wallpapers_uploader" }),
    );
  });
});

type MockQueryRunner = QueryRunner & {
  hasTable: jest.Mock;
  getTable: jest.Mock;
  getTables: jest.Mock;
  query: jest.Mock;
  dropForeignKey: jest.Mock;
  createForeignKey: jest.Mock;
};

function createQueryRunner(
  isGenerated: boolean,
  tables: Table[] = [],
): MockQueryRunner {
  const users = new Table({
    name: "users",
    columns: [
      new TableColumn({
        name: "id",
        type: "bigint",
        isPrimary: true,
        isGenerated,
      }),
    ],
  });

  return {
    hasTable: jest.fn((name: string) => Promise.resolve(name === "users")),
    getTable: jest.fn().mockResolvedValue(users),
    getTables: jest.fn().mockResolvedValue(tables),
    query: jest.fn().mockResolvedValue(undefined),
    dropForeignKey: jest.fn().mockResolvedValue(undefined),
    createForeignKey: jest.fn().mockResolvedValue(undefined),
  } as unknown as MockQueryRunner;
}

function createReference(
  tableName: string,
  foreignKeyName: string,
  referencedTableName = "users",
): Table {
  return new Table({
    name: tableName,
    foreignKeys: [
      new TableForeignKey({
        name: foreignKeyName,
        columnNames: ["owner_id"],
        referencedTableName,
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    ],
  });
}
