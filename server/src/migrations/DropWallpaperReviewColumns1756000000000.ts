import { MigrationInterface, QueryRunner } from "typeorm";

/** 不做人工审核：驳回稿改回草稿，并删除审核列 */
export class DropWallpaperReviewColumns1756000000000 implements MigrationInterface {
  name = "DropWallpaperReviewColumns1756000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    await queryRunner.query(
      "UPDATE `wallpapers` SET `status` = 0 WHERE `status` = 2",
    );

    if (await queryRunner.hasColumn("wallpapers", "review_note")) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `review_note`",
      );
    }
    if (await queryRunner.hasColumn("wallpapers", "reviewed_by")) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `reviewed_by`",
      );
    }
    if (await queryRunner.hasColumn("wallpapers", "reviewed_at")) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` DROP COLUMN `reviewed_at`",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    if (!(await queryRunner.hasColumn("wallpapers", "review_note"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `review_note` VARCHAR(500) NULL COMMENT '审核说明'",
      );
    }
    if (!(await queryRunner.hasColumn("wallpapers", "reviewed_by"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `reviewed_by` BIGINT NULL COMMENT '审核管理员ID'",
      );
    }
    if (!(await queryRunner.hasColumn("wallpapers", "reviewed_at"))) {
      await queryRunner.query(
        "ALTER TABLE `wallpapers` ADD COLUMN `reviewed_at` DATETIME NULL COMMENT '审核时间'",
      );
    }
  }
}
