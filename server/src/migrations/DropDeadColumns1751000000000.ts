import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 删除 Post/Comment 表的废弃列（对应功能从未启用）
 * - posts: is_pinned / is_featured / metadata
 * - comments: status / metadata
 */
export class DropDeadColumns1751000000000 implements MigrationInterface {
  name = "DropDeadColumns1751000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("posts")) {
      // MySQL DROP COLUMN 会自动移除单列索引（idx_is_pinned / idx_is_featured）
      if (await queryRunner.hasColumn("posts", "is_pinned")) {
        await queryRunner.query("ALTER TABLE `posts` DROP COLUMN `is_pinned`");
      }
      if (await queryRunner.hasColumn("posts", "is_featured")) {
        await queryRunner.query(
          "ALTER TABLE `posts` DROP COLUMN `is_featured`",
        );
      }
      if (await queryRunner.hasColumn("posts", "metadata")) {
        await queryRunner.query("ALTER TABLE `posts` DROP COLUMN `metadata`");
      }
    }

    if (await queryRunner.hasTable("comments")) {
      if (await queryRunner.hasColumn("comments", "status")) {
        await queryRunner.query("ALTER TABLE `comments` DROP COLUMN `status`");
      }
      if (await queryRunner.hasColumn("comments", "metadata")) {
        await queryRunner.query(
          "ALTER TABLE `comments` DROP COLUMN `metadata`",
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("posts")) {
      if (!(await queryRunner.hasColumn("posts", "metadata"))) {
        await queryRunner.query(
          "ALTER TABLE `posts` ADD `metadata` text NULL COMMENT '元数据'",
        );
      }
      if (!(await queryRunner.hasColumn("posts", "is_featured"))) {
        await queryRunner.query(
          "ALTER TABLE `posts` ADD `is_featured` tinyint NOT NULL DEFAULT 0 COMMENT '是否精华'",
        );
        await queryRunner.query(
          "ALTER TABLE `posts` ADD INDEX `idx_is_featured` (`is_featured`)",
        );
      }
      if (!(await queryRunner.hasColumn("posts", "is_pinned"))) {
        await queryRunner.query(
          "ALTER TABLE `posts` ADD `is_pinned` tinyint NOT NULL DEFAULT 0 COMMENT '是否置顶'",
        );
        await queryRunner.query(
          "ALTER TABLE `posts` ADD INDEX `idx_is_pinned` (`is_pinned`)",
        );
      }
    }

    if (await queryRunner.hasTable("comments")) {
      if (!(await queryRunner.hasColumn("comments", "metadata"))) {
        await queryRunner.query(
          "ALTER TABLE `comments` ADD `metadata` varchar(255) NULL COMMENT '元数据'",
        );
      }
      if (!(await queryRunner.hasColumn("comments", "status"))) {
        await queryRunner.query(
          "ALTER TABLE `comments` ADD `status` varchar(255) NULL COMMENT '状态'",
        );
      }
    }
  }
}
