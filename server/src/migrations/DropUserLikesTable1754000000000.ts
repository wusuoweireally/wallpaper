import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 删除 user_likes 表（壁纸点赞功能全站下线：无前端入口，评分公式已不含 likeCount）
 * 关联外键（用户/壁纸删除时级联）随表删除一并释放。
 */
export class DropUserLikesTable1754000000000 implements MigrationInterface {
  name = "DropUserLikesTable1754000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("user_likes")) {
      await queryRunner.query("DROP TABLE `user_likes`");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("user_likes")) return;
    await queryRunner.query(`
      CREATE TABLE \`user_likes\` (
        \`id\` bigint NOT NULL AUTO_INCREMENT,
        \`user_id\` bigint NOT NULL COMMENT '用户ID',
        \`wallpaper_id\` bigint NOT NULL COMMENT '壁纸ID',
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uk_user_likes_user_wallpaper\` (\`user_id\`,\`wallpaper_id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_wallpaper_id\` (\`wallpaper_id\`),
        KEY \`idx_created_at\` (\`created_at\`),
        CONSTRAINT \`fk_user_likes_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_user_likes_wallpaper\` FOREIGN KEY (\`wallpaper_id\`) REFERENCES \`wallpapers\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  }
}
