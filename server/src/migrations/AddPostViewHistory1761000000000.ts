import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 帖子浏览去重表：结构对齐 view_history，把壁纸那套 1 小时窗口防刷
 * （浏览数进 popular 排序公式）同样应用到帖子，堵住匿名单次请求即 +1 的刷榜路径。
 */
export class AddPostViewHistory1761000000000 implements MigrationInterface {
  name = "AddPostViewHistory1761000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("posts"))) return;
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS post_view_history (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        post_id BIGINT NOT NULL,
        viewed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_post_view_history_user_post (user_id, post_id),
        KEY idx_pvh_user_id (user_id),
        KEY idx_pvh_post_id (post_id),
        KEY idx_pvh_viewed_at (viewed_at),
        KEY idx_pvh_user_viewed (user_id, viewed_at),
        CONSTRAINT fk_pvh_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_pvh_post FOREIGN KEY (post_id)
          REFERENCES posts (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS post_view_history");
  }
}
