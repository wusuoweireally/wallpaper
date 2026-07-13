import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 移除壁纸标题与描述字段（产品不再支持）
 */
export class DropWallpaperTitleDescription1750000000000 implements MigrationInterface {
  name = "DropWallpaperTitleDescription1750000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    if (await queryRunner.hasColumn("wallpapers", "description")) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` DROP COLUMN \`description\``,
      );
    }
    if (await queryRunner.hasColumn("wallpapers", "title")) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` DROP COLUMN \`title\``,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    if (!(await queryRunner.hasColumn("wallpapers", "title"))) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` ADD \`title\` varchar(200) NULL COMMENT '壁纸标题' AFTER \`file_url\``,
      );
    }
    if (!(await queryRunner.hasColumn("wallpapers", "description"))) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` ADD \`description\` text NULL COMMENT '壁纸描述' AFTER \`title\``,
      );
    }
  }
}
