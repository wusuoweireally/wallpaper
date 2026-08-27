import { MigrationInterface, QueryRunner } from "typeorm";

/** 壁纸加 palette JSON：详情页多色色板 */
export class AddPaletteToWallpaper1757000000000 implements MigrationInterface {
  name = "AddPaletteToWallpaper1757000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    if (!(await queryRunner.hasColumn("wallpapers", "palette"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `palette` json NULL COMMENT '主色板 hex 数组，按占比降序' AFTER `color_bucket`",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    if (await queryRunner.hasColumn("wallpapers", "palette")) {
      await queryRunner.query("ALTER TABLE `wallpapers` DROP COLUMN `palette`");
    }
  }
}
