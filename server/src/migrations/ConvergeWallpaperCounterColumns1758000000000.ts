import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 壁纸计数列/索引收敛：
 * - 删死列 like_count / download_count（点赞与下载统计功能已下线，全仓零读写）
 * - 删无人使用的索引 idx_wallpapers_file_url / idx_wallpapers_thumbnail_url
 * - 给 favorite_count 补索引（可作列表排序字段且参与热门公式）
 */
export class ConvergeWallpaperCounterColumns1758000000000 implements MigrationInterface {
  name = "ConvergeWallpaperCounterColumns1758000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    const table = await queryRunner.getTable("wallpapers");
    if (!table) return;

    for (const name of [
      "idx_like_count",
      "idx_wallpapers_file_url",
      "idx_wallpapers_thumbnail_url",
    ]) {
      const index = table.indices.find((i) => i.name === name);
      if (index) await queryRunner.dropIndex("wallpapers", index);
    }

    if (await queryRunner.hasColumn("wallpapers", "like_count")) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `like_count`",
      );
    }
    if (await queryRunner.hasColumn("wallpapers", "download_count")) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `download_count`",
      );
    }

    // MySQL 无 CREATE INDEX IF NOT EXISTS：崩溃恢复重跑/DBA 手工补过时防 ER_DUP_KEYNAME
    const hasFavoriteIndex = table.indices.some(
      (i) => i.name === "idx_favorite_count",
    );
    if (!hasFavoriteIndex) {
      await queryRunner.query(
        "CREATE INDEX `idx_favorite_count` ON `wallpapers` (`favorite_count`)",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    const table = await queryRunner.getTable("wallpapers");

    const favoriteIndex = table?.indices.find(
      (i) => i.name === "idx_favorite_count",
    );
    if (favoriteIndex) {
      await queryRunner.dropIndex("wallpapers", favoriteIndex);
    }

    if (!(await queryRunner.hasColumn("wallpapers", "like_count"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `like_count` int NOT NULL DEFAULT 0 COMMENT '点赞数'",
      );
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD INDEX `idx_like_count` (`like_count`)",
      );
    }
    if (!(await queryRunner.hasColumn("wallpapers", "download_count"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `download_count` int NOT NULL DEFAULT 0 COMMENT '下载次数'",
      );
    }

    for (const [name, column] of [
      ["idx_wallpapers_file_url", "file_url"],
      ["idx_wallpapers_thumbnail_url", "thumbnail_url"],
    ] as const) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` ADD INDEX \`${name}\` (\`${column}\`)`,
      );
    }
  }
}
