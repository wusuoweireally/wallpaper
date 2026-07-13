import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1600000000000 implements MigrationInterface {
  name = "InitialSchema1600000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      `CREATE TABLE IF NOT EXISTS users (
        id BIGINT NOT NULL AUTO_INCREMENT,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(500) NULL DEFAULT 'defaultAvatar.png',
        bio TEXT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        status TINYINT NOT NULL DEFAULT 1,
        role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
        github_id BIGINT NULL,
        github_login VARCHAR(100) NULL,
        github_avatar_url VARCHAR(500) NULL,
        github_bio TEXT NULL,
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uk_users_username (username),
        UNIQUE KEY uk_users_email (email),
        UNIQUE KEY uk_users_github_id (github_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS tags (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL,
        usage_count INT NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_tags_name (name),
        UNIQUE KEY uk_slug (slug),
        KEY idx_usage_count (usage_count)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS wallpapers (
        id BIGINT NOT NULL AUTO_INCREMENT,
        file_url VARCHAR(500) NOT NULL,
        category ENUM('general', 'anime', 'people') NOT NULL DEFAULT 'general',
        sub_category VARCHAR(50) NULL,
        thumbnail_url VARCHAR(500) NULL,
        file_size BIGINT NOT NULL,
        format VARCHAR(20) NULL,
        width INT NOT NULL,
        height INT NOT NULL,
        aspect_ratio DECIMAL(5, 2) NULL,
        uploader_id BIGINT NOT NULL,
        view_count INT NOT NULL DEFAULT 0,
        like_count INT NOT NULL DEFAULT 0,
        favorite_count INT NOT NULL DEFAULT 0,
        download_count INT NOT NULL DEFAULT 0,
        status TINYINT NOT NULL DEFAULT 0,
        review_note VARCHAR(500) NULL,
        reviewed_by BIGINT NULL,
        reviewed_at DATETIME NULL,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY idx_category (category),
        KEY idx_sub_category (sub_category),
        KEY idx_aspect_ratio (aspect_ratio),
        KEY idx_uploader_id (uploader_id),
        KEY idx_view_count_desc (view_count),
        KEY idx_like_count (like_count),
        KEY idx_status (status),
        KEY idx_is_featured (is_featured),
        KEY idx_created_at_desc (created_at),
        CONSTRAINT fk_wallpapers_uploader FOREIGN KEY (uploader_id)
          REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS wallpaper_tags (
        wallpaper_id BIGINT NOT NULL,
        tag_id INT NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (wallpaper_id, tag_id),
        KEY idx_tag_id (tag_id),
        CONSTRAINT fk_wallpaper_tags_wallpaper FOREIGN KEY (wallpaper_id)
          REFERENCES wallpapers (id) ON DELETE CASCADE,
        CONSTRAINT fk_wallpaper_tags_tag FOREIGN KEY (tag_id)
          REFERENCES tags (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS user_likes (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        wallpaper_id BIGINT NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_user_likes_user_wallpaper (user_id, wallpaper_id),
        KEY idx_user_id (user_id),
        KEY idx_wallpaper_id (wallpaper_id),
        KEY idx_created_at (created_at),
        CONSTRAINT fk_user_likes_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_user_likes_wallpaper FOREIGN KEY (wallpaper_id)
          REFERENCES wallpapers (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS user_favorites (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        wallpaper_id BIGINT NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_user_favorites_user_wallpaper (user_id, wallpaper_id),
        KEY idx_user_id (user_id),
        KEY idx_wallpaper_id (wallpaper_id),
        KEY idx_created_at (created_at),
        KEY idx_user_favorites_user_created (user_id, created_at),
        CONSTRAINT fk_user_favorites_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_user_favorites_wallpaper FOREIGN KEY (wallpaper_id)
          REFERENCES wallpapers (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS view_history (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        wallpaper_id BIGINT NOT NULL,
        viewed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_view_history_user_wallpaper (user_id, wallpaper_id),
        KEY idx_user_id (user_id),
        KEY idx_wallpaper_id (wallpaper_id),
        KEY idx_viewed_at (viewed_at),
        KEY idx_view_history_user_viewed (user_id, viewed_at),
        CONSTRAINT fk_view_history_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_view_history_wallpaper FOREIGN KEY (wallpaper_id)
          REFERENCES wallpapers (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS posts (
        id BIGINT NOT NULL AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category ENUM('tech_discussion', 'experience_sharing', 'q_a', 'resource_sharing') NOT NULL,
        status ENUM('draft', 'published', 'moderated', 'hidden') NOT NULL DEFAULT 'published',
        author_id BIGINT NOT NULL,
        view_count INT NOT NULL DEFAULT 0,
        like_count INT NOT NULL DEFAULT 0,
        comment_count INT NOT NULL DEFAULT 0,
        share_count INT NOT NULL DEFAULT 0,
        is_pinned TINYINT(1) NOT NULL DEFAULT 0,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        last_comment_at DATETIME NULL,
        tags VARCHAR(255) NULL,
        summary TEXT NULL,
        thumbnail_url VARCHAR(500) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        metadata TEXT NULL,
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY idx_category (category),
        KEY idx_status (status),
        KEY idx_author_id (author_id),
        KEY idx_view_count_desc (view_count),
        KEY idx_like_count (like_count),
        KEY idx_comment_count (comment_count),
        KEY idx_is_pinned (is_pinned),
        KEY idx_is_featured (is_featured),
        KEY idx_last_comment_at (last_comment_at),
        KEY idx_created_at_desc (created_at),
        CONSTRAINT fk_posts_author FOREIGN KEY (author_id)
          REFERENCES users (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS comments (
        id BIGINT NOT NULL AUTO_INCREMENT,
        content TEXT NOT NULL,
        post_id BIGINT NOT NULL,
        author_id BIGINT NOT NULL,
        parent_id BIGINT NULL,
        like_count INT NOT NULL DEFAULT 0,
        reply_count INT NOT NULL DEFAULT 0,
        status VARCHAR(255) NULL,
        metadata VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME(6) NULL,
        PRIMARY KEY (id),
        KEY idx_comment_post_id (post_id),
        KEY idx_comment_author_id (author_id),
        KEY idx_comment_parent_id (parent_id),
        KEY idx_comment_like_count (like_count),
        KEY idx_comment_reply_count (reply_count),
        KEY idx_comment_created_at (created_at),
        KEY idx_comment_updated_at (updated_at),
        KEY idx_comments_post_created (post_id, created_at),
        CONSTRAINT fk_comments_post FOREIGN KEY (post_id)
          REFERENCES posts (id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_author FOREIGN KEY (author_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id)
          REFERENCES comments (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS post_likes (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        post_id BIGINT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_post_likes_user_post (user_id, post_id),
        KEY idx_post_like_user_id (user_id),
        KEY idx_post_like_post_id (post_id),
        KEY idx_post_like_created_at (created_at),
        CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id)
          REFERENCES posts (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS comment_likes (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        comment_id BIGINT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_comment_likes_user_comment (user_id, comment_id),
        KEY idx_comment_like_user_id (user_id),
        KEY idx_comment_like_comment_id (comment_id),
        KEY idx_comment_like_created_at (created_at),
        CONSTRAINT fk_comment_likes_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id)
          REFERENCES comments (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS post_bookmarks (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        post_id BIGINT NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY uk_post_bookmarks_user_post (user_id, post_id),
        KEY idx_bookmark_user_id (user_id),
        KEY idx_bookmark_post_id (post_id),
        KEY idx_bookmark_created_at (created_at),
        CONSTRAINT fk_post_bookmarks_user FOREIGN KEY (user_id)
          REFERENCES users (id) ON DELETE CASCADE,
        CONSTRAINT fk_post_bookmarks_post FOREIGN KEY (post_id)
          REFERENCES posts (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

      `CREATE TABLE IF NOT EXISTS reports (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id BIGINT NOT NULL,
        target_type ENUM('post', 'comment') NOT NULL,
        target_id BIGINT NOT NULL,
        reason ENUM('spam', 'inappropriate', 'harassment', 'violence', 'copyright', 'misinformation', 'other') NOT NULL,
        description TEXT NULL,
        status ENUM('pending', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
        reviewed_by BIGINT NULL,
        review_note TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_reports_user_target (user_id, target_type, target_id),
        KEY idx_reports_status_created (status, created_at),
        KEY idx_reports_user (user_id),
        KEY idx_reports_reviewer (reviewed_by),
        CONSTRAINT fk_reports_user FOREIGN KEY (user_id) REFERENCES users (id),
        CONSTRAINT fk_reports_reviewer FOREIGN KEY (reviewed_by) REFERENCES users (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ];

    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      "reports",
      "post_bookmarks",
      "comment_likes",
      "post_likes",
      "comments",
      "posts",
      "view_history",
      "user_favorites",
      "user_likes",
      "wallpaper_tags",
      "wallpapers",
      "tags",
      "users",
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
  }
}
