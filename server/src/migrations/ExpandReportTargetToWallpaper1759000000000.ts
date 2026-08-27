import { MigrationInterface, QueryRunner } from "typeorm";

/** reports.target_type 扩壁纸：核心内容此前不可被举报 */
export class ExpandReportTargetToWallpaper1759000000000 implements MigrationInterface {
  name = "ExpandReportTargetToWallpaper1759000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("reports"))) return;
    await queryRunner.query(
      "ALTER TABLE `reports` MODIFY COLUMN `target_type` enum('post','comment','wallpaper') NOT NULL COMMENT '举报目标类型'",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("reports"))) return;
    // 回退前清掉壁纸类举报，否则枚举收窄会因存量值失败
    await queryRunner.query(
      "DELETE FROM `reports` WHERE `target_type` = 'wallpaper'",
    );
    await queryRunner.query(
      "ALTER TABLE `reports` MODIFY COLUMN `target_type` enum('post','comment') NOT NULL COMMENT '举报目标类型'",
    );
  }
}
