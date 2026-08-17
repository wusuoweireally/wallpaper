import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * P2：主色字段 + 用户合集（collections）
 */
export class AddColorAndCollections1752000000000 implements MigrationInterface {
  name = "AddColorAndCollections1752000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("wallpapers")) {
      if (!(await queryRunner.hasColumn("wallpapers", "dominant_color"))) {
        await queryRunner.query(
          "ALTER TABLE `wallpapers` ADD COLUMN `dominant_color` varchar(7) NULL COMMENT '主色 hex'",
        );
      }
      if (!(await queryRunner.hasColumn("wallpapers", "color_bucket"))) {
        await queryRunner.query(
          "ALTER TABLE `wallpapers` ADD COLUMN `color_bucket` varchar(20) NULL COMMENT '主色粗分桶'",
        );
        await queryRunner.query(
          "CREATE INDEX `idx_color_bucket` ON `wallpapers` (`color_bucket`)",
        );
      }
    }

    if (!(await queryRunner.hasTable("collections"))) {
      await queryRunner.query(`
        CREATE TABLE \`collections\` (
          \`id\` bigint NOT NULL AUTO_INCREMENT COMMENT '合集ID',
          \`user_id\` bigint NOT NULL COMMENT '用户ID',
          \`name\` varchar(80) NOT NULL COMMENT '合集名称',
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
          PRIMARY KEY (\`id\`),
          KEY \`idx_collections_user_id\` (\`user_id\`),
          KEY \`idx_collections_user_created\` (\`user_id\`, \`created_at\`),
          CONSTRAINT \`fk_collections_user\` FOREIGN KEY (\`user_id\`)
            REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    if (!(await queryRunner.hasTable("collection_wallpapers"))) {
      await queryRunner.query(`
        CREATE TABLE \`collection_wallpapers\` (
          \`id\` bigint NOT NULL AUTO_INCREMENT COMMENT 'ID',
          \`collection_id\` bigint NOT NULL COMMENT '合集ID',
          \`wallpaper_id\` bigint NOT NULL COMMENT '壁纸ID',
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '加入时间',
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uk_collection_wallpaper\` (\`collection_id\`, \`wallpaper_id\`),
          KEY \`idx_cw_wallpaper\` (\`wallpaper_id\`),
          CONSTRAINT \`fk_cw_collection\` FOREIGN KEY (\`collection_id\`)
            REFERENCES \`collections\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_cw_wallpaper\` FOREIGN KEY (\`wallpaper_id\`)
            REFERENCES \`wallpapers\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("collection_wallpapers")) {
      await queryRunner.query("DROP TABLE `collection_wallpapers`");
    }
    if (await queryRunner.hasTable("collections")) {
      await queryRunner.query("DROP TABLE `collections`");
    }
    if (await queryRunner.hasTable("wallpapers")) {
      if (await queryRunner.hasColumn("wallpapers", "color_bucket")) {
        await queryRunner.query(
          "ALTER TABLE `wallpapers` DROP INDEX `idx_color_bucket`",
        );
        await queryRunner.query(
          "ALTER TABLE `wallpapers` DROP COLUMN `color_bucket`",
        );
      }
      if (await queryRunner.hasColumn("wallpapers", "dominant_color")) {
        await queryRunner.query(
          "ALTER TABLE `wallpapers` DROP COLUMN `dominant_color`",
        );
      }
    }
  }
}
