import { MigrationInterface, QueryRunner } from "typeorm";

/** 文件内容 SHA-256，用于精确查重 */
export class AddContentHashToWallpaper1753000000000 implements MigrationInterface {
  name = "AddContentHashToWallpaper1753000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    if (!(await queryRunner.hasColumn("wallpapers", "content_hash"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `content_hash` varchar(64) NULL COMMENT '文件SHA256' AFTER `format`",
      );
      await queryRunner.query(
        "CREATE UNIQUE INDEX `uk_wallpapers_content_hash` ON `wallpapers` (`content_hash`)",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    if (await queryRunner.hasColumn("wallpapers", "content_hash")) {
      await queryRunner.query(
        "DROP INDEX `uk_wallpapers_content_hash` ON `wallpapers`",
      );
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `content_hash`",
      );
    }
  }
}
