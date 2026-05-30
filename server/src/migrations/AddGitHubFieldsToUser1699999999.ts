import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddGitHubFieldsToUser1699999999000 implements MigrationInterface {
  name = "AddGitHubFieldsToUser1699999999000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) return;

    if (!(await queryRunner.hasColumn("users", "github_id"))) {
      await queryRunner.query(
        "ALTER TABLE users ADD COLUMN github_id BIGINT NULL UNIQUE COMMENT 'GitHub用户ID'",
      );
    }

    if (!(await queryRunner.hasColumn("users", "github_login"))) {
      await queryRunner.query(
        "ALTER TABLE users ADD COLUMN github_login VARCHAR(100) NULL COMMENT 'GitHub用户名'",
      );
    }

    if (!(await queryRunner.hasColumn("users", "github_avatar_url"))) {
      await queryRunner.query(
        "ALTER TABLE users ADD COLUMN github_avatar_url VARCHAR(500) NULL COMMENT 'GitHub头像URL'",
      );
    }

    if (!(await queryRunner.hasColumn("users", "github_bio"))) {
      await queryRunner.query(
        "ALTER TABLE users ADD COLUMN github_bio TEXT NULL COMMENT 'GitHub个人简介'",
      );
    }

    const table = await queryRunner.getTable("users");
    const hasGithubIndex =
      table?.indices.some((index) => index.columnNames.includes("github_id")) ||
      table?.uniques.some((unique) => unique.columnNames.includes("github_id"));

    if (!hasGithubIndex) {
      await queryRunner.createIndex(
        "users",
        new TableIndex({
          name: "IDX_GITHUB_ID",
          columnNames: ["github_id"],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) return;

    const table = await queryRunner.getTable("users");
    if (table?.indices.some((index) => index.name === "IDX_GITHUB_ID")) {
      await queryRunner.dropIndex("users", "IDX_GITHUB_ID");
    }

    if (await queryRunner.hasColumn("users", "github_bio")) {
      await queryRunner.query("ALTER TABLE users DROP COLUMN github_bio");
    }
    if (await queryRunner.hasColumn("users", "github_avatar_url")) {
      await queryRunner.query(
        "ALTER TABLE users DROP COLUMN github_avatar_url",
      );
    }
    if (await queryRunner.hasColumn("users", "github_login")) {
      await queryRunner.query("ALTER TABLE users DROP COLUMN github_login");
    }
    if (await queryRunner.hasColumn("users", "github_id")) {
      await queryRunner.query("ALTER TABLE users DROP COLUMN github_id");
    }
  }
}
