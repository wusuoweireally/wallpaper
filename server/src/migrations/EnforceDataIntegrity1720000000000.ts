import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableIndex,
} from "typeorm";

interface ReferencingForeignKey {
  tableName: string;
  foreignKey: TableForeignKey;
}

export class EnforceDataIntegrity1720000000000 implements MigrationInterface {
  name = "EnforceDataIntegrity1720000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureGeneratedUserId(queryRunner);
    if (await queryRunner.hasTable("wallpapers")) {
      await queryRunner.query(
        "ALTER TABLE wallpapers ALTER COLUMN status SET DEFAULT 0",
      );
    }
    await this.deduplicateWallpaperInteractions(queryRunner);
    await this.deduplicateViewHistory(queryRunner);
    await this.deduplicateReports(queryRunner);
    await this.rebuildCounters(queryRunner);
  }

  public down(): Promise<void> {
    return Promise.reject(
      new Error("该迁移包含不可逆的数据去重，请从数据库备份恢复"),
    );
  }

  private async ensureGeneratedUserId(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) return;

    const users = await queryRunner.getTable("users");
    const id = users?.findColumnByName("id");
    if (!id || id.isGenerated) return;

    const references = (await queryRunner.getTables()).flatMap((table) =>
      table.foreignKeys
        .filter(
          (foreignKey) =>
            foreignKey.referencedTableName === "users" &&
            foreignKey.referencedColumnNames.includes("id"),
        )
        .map((foreignKey) => ({
          tableName: table.name,
          foreignKey: foreignKey.clone(),
        })),
    );
    const dropped: ReferencingForeignKey[] = [];
    let firstError: unknown;
    let hasError = false;

    try {
      for (const reference of references) {
        await queryRunner.dropForeignKey(
          reference.tableName,
          reference.foreignKey,
        );
        dropped.push(reference);
      }

      await queryRunner.query(
        "ALTER TABLE users MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT",
      );
    } catch (error) {
      firstError = error;
      hasError = true;
    }

    for (const reference of dropped) {
      try {
        await queryRunner.createForeignKey(
          reference.tableName,
          reference.foreignKey,
        );
      } catch (error) {
        if (!hasError) {
          firstError = error;
          hasError = true;
        }
      }
    }

    if (hasError) throw firstError;
  }

  private async deduplicateReports(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("reports"))) return;

    await queryRunner.query(`
      DELETE duplicate
      FROM reports duplicate
      INNER JOIN reports keeper
        ON keeper.user_id = duplicate.user_id
       AND keeper.target_type = duplicate.target_type
       AND keeper.target_id = duplicate.target_id
       AND keeper.id < duplicate.id
    `);
    await this.ensureUniqueIndex(
      queryRunner,
      "reports",
      "uk_reports_user_target",
      ["user_id", "target_type", "target_id"],
    );
  }

  private async deduplicateWallpaperInteractions(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await queryRunner.hasTable("user_likes")) {
      await queryRunner.query(`
        DELETE duplicate
        FROM user_likes duplicate
        INNER JOIN user_likes keeper
          ON keeper.user_id = duplicate.user_id
         AND keeper.wallpaper_id = duplicate.wallpaper_id
         AND keeper.id < duplicate.id
      `);
      await this.dropIndexIfExists(
        queryRunner,
        "user_likes",
        "uk_user_wallpaper",
      );
      await this.ensureUniqueIndex(
        queryRunner,
        "user_likes",
        "uk_user_likes_user_wallpaper",
        ["user_id", "wallpaper_id"],
      );
    }

    if (await queryRunner.hasTable("user_favorites")) {
      await queryRunner.query(`
        DELETE duplicate
        FROM user_favorites duplicate
        INNER JOIN user_favorites keeper
          ON keeper.user_id = duplicate.user_id
         AND keeper.wallpaper_id = duplicate.wallpaper_id
         AND keeper.id < duplicate.id
      `);
      await this.dropIndexIfExists(
        queryRunner,
        "user_favorites",
        "uk_user_wallpaper",
      );
      await this.ensureUniqueIndex(
        queryRunner,
        "user_favorites",
        "uk_user_favorites_user_wallpaper",
        ["user_id", "wallpaper_id"],
      );
    }
  }

  private async deduplicateViewHistory(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (!(await queryRunner.hasTable("view_history"))) return;

    await queryRunner.query(`
      DELETE older
      FROM view_history older
      INNER JOIN view_history newer
        ON newer.user_id = older.user_id
       AND newer.wallpaper_id = older.wallpaper_id
       AND (
         newer.viewed_at > older.viewed_at
         OR (newer.viewed_at = older.viewed_at AND newer.id > older.id)
       )
    `);
    await this.ensureUniqueIndex(
      queryRunner,
      "view_history",
      "uk_view_history_user_wallpaper",
      ["user_id", "wallpaper_id"],
    );
  }

  private async rebuildCounters(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable("wallpapers")) {
      if (await queryRunner.hasTable("user_likes")) {
        await queryRunner.query(`
          UPDATE wallpapers wallpaper
          LEFT JOIN (
            SELECT wallpaper_id, COUNT(*) AS total
            FROM user_likes
            GROUP BY wallpaper_id
          ) likes ON likes.wallpaper_id = wallpaper.id
          SET wallpaper.like_count = COALESCE(likes.total, 0)
        `);
      }
      if (await queryRunner.hasTable("user_favorites")) {
        await queryRunner.query(`
          UPDATE wallpapers wallpaper
          LEFT JOIN (
            SELECT wallpaper_id, COUNT(*) AS total
            FROM user_favorites
            GROUP BY wallpaper_id
          ) favorites ON favorites.wallpaper_id = wallpaper.id
          SET wallpaper.favorite_count = COALESCE(favorites.total, 0)
        `);
      }
    }

    if (
      (await queryRunner.hasTable("posts")) &&
      (await queryRunner.hasTable("post_likes"))
    ) {
      await queryRunner.query(`
        UPDATE posts post
        LEFT JOIN (
          SELECT post_id, COUNT(*) AS total
          FROM post_likes
          GROUP BY post_id
        ) likes ON likes.post_id = post.id
        SET post.like_count = COALESCE(likes.total, 0)
      `);
    }

    if (await queryRunner.hasTable("comments")) {
      if (await queryRunner.hasTable("comment_likes")) {
        await queryRunner.query(`
          UPDATE comments comment
          LEFT JOIN (
            SELECT comment_id, COUNT(*) AS total
            FROM comment_likes
            GROUP BY comment_id
          ) likes ON likes.comment_id = comment.id
          SET comment.like_count = COALESCE(likes.total, 0)
        `);
      }
      await queryRunner.query(`
        UPDATE comments comment
        LEFT JOIN (
          SELECT parent_id, COUNT(*) AS total
          FROM comments
          WHERE parent_id IS NOT NULL AND deleted_at IS NULL
          GROUP BY parent_id
        ) replies ON replies.parent_id = comment.id
        SET comment.reply_count = COALESCE(replies.total, 0)
      `);
    }

    if (
      (await queryRunner.hasTable("posts")) &&
      (await queryRunner.hasTable("comments"))
    ) {
      await queryRunner.query(`
        UPDATE posts post
        LEFT JOIN (
          SELECT post_id, COUNT(*) AS total, MAX(created_at) AS latest
          FROM comments
          WHERE deleted_at IS NULL
          GROUP BY post_id
        ) comments ON comments.post_id = post.id
        SET post.comment_count = COALESCE(comments.total, 0),
            post.last_comment_at = comments.latest
      `);
    }

    if (
      (await queryRunner.hasTable("tags")) &&
      (await queryRunner.hasTable("wallpaper_tags"))
    ) {
      await queryRunner.query(`
        UPDATE tags tag
        LEFT JOIN (
          SELECT relation.tag_id, COUNT(*) AS total
          FROM wallpaper_tags relation
          INNER JOIN wallpapers wallpaper
            ON wallpaper.id = relation.wallpaper_id
           AND wallpaper.status = 1
          GROUP BY relation.tag_id
        ) relations ON relations.tag_id = tag.id
        SET tag.usage_count = COALESCE(relations.total, 0)
      `);
    }
  }

  private async ensureUniqueIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
    columnNames: string[],
  ): Promise<void> {
    const table = await queryRunner.getTable(tableName);
    if (!table) return;

    const expectedColumns = [...columnNames].sort().join(",");
    const equivalent = table.indices.some(
      (index) =>
        index.isUnique &&
        [...index.columnNames].sort().join(",") === expectedColumns,
    );
    if (equivalent) return;

    const conflictingName = table.indices.find(
      (index) => index.name === indexName,
    );
    if (conflictingName) {
      await queryRunner.dropIndex(tableName, conflictingName);
    }

    await queryRunner.createIndex(
      tableName,
      new TableIndex({
        name: indexName,
        columnNames,
        isUnique: true,
      }),
    );
  }

  private async dropIndexIfExists(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<void> {
    if (!(await queryRunner.hasTable(tableName))) return;
    const table = await queryRunner.getTable(tableName);
    const index = table?.indices.find(
      (candidate) => candidate.name === indexName,
    );
    if (index) await queryRunner.dropIndex(tableName, index);
  }
}
