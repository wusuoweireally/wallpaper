import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddWallpaperAssetIndexes1740000000000 implements MigrationInterface {
  name = "AddWallpaperAssetIndexes1740000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    const table = await queryRunner.getTable("wallpapers");
    if (!table) return;

    for (const [name, columnName] of [
      ["idx_wallpapers_file_url", "file_url"],
      ["idx_wallpapers_thumbnail_url", "thumbnail_url"],
    ] as const) {
      if (table.indices.some((index) => index.name === name)) continue;
      await queryRunner.createIndex(
        table,
        new TableIndex({ name, columnNames: [columnName] }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    const table = await queryRunner.getTable("wallpapers");
    if (!table) return;

    for (const name of [
      "idx_wallpapers_thumbnail_url",
      "idx_wallpapers_file_url",
    ]) {
      const index = table.indices.find((candidate) => candidate.name === name);
      if (index) await queryRunner.dropIndex(table, index);
    }
  }
}
