import { MigrationInterface, QueryRunner } from "typeorm";

/** 壁纸列表主查询 (status, created_at DESC) 复合索引，替换仅按 status 的单列索引 */
export class AddWallpaperStatusCreatedAtIndex1760000000000 implements MigrationInterface {
  name = "AddWallpaperStatusCreatedAtIndex1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    // 复合索引左前缀覆盖 status 单列查询，旧单列索引可安全删除
    await queryRunner.query(
      "CREATE INDEX `idx_status_created_at` ON `wallpapers` (`status`, `created_at`)",
    );
    await queryRunner.query("DROP INDEX `idx_status` ON `wallpapers`");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    await queryRunner.query(
      "CREATE INDEX `idx_status` ON `wallpapers` (`status`)",
    );
    await queryRunner.query("DROP INDEX `idx_status_created_at` ON `wallpapers`");
  }
}
