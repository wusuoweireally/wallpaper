import { MigrationInterface, QueryRunner } from "typeorm";

/** 壁纸加 preview_url 列（1600px 预览图，详情占位 / 卡片 hover 用） */
export class AddPreviewUrlToWallpaper1755000000000 implements MigrationInterface {
  name = "AddPreviewUrlToWallpaper1755000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    // MySQL DDL 非事务：跑到一半记录失败时重跑不能因列已存在而中断
    if (!(await queryRunner.hasColumn("wallpapers", "preview_url"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `preview_url` VARCHAR(500) NULL COMMENT '预览图URL(1600px, hover/详情占位用)' AFTER `thumbnail_url`",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    if (await queryRunner.hasColumn("wallpapers", "preview_url")) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `preview_url`",
      );
    }
  }
}
