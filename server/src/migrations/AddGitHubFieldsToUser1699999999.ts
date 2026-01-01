import { MigrationInterface, QueryRunner, TableIndex } from "typeorm";

export class AddGitHubFieldsToUser1699999999 implements MigrationInterface {
  name = "AddGitHubFieldsToUser1699999999";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 添加 GitHub 相关字段到 users 表
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN github_id BIGINT NULL UNIQUE COMMENT 'GitHub用户ID',
      ADD COLUMN github_login VARCHAR(100) NULL COMMENT 'GitHub用户名',
      ADD COLUMN github_avatar_url VARCHAR(500) NULL COMMENT 'GitHub头像URL',
      ADD COLUMN github_bio TEXT NULL COMMENT 'GitHub个人简介'
    `);

    // 为 github_id 添加索引以提高查询性能
    await queryRunner.createIndex(
      "users",
      new TableIndex({
        name: "IDX_GITHUB_ID",
        columnNames: ["github_id"],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 删除索引
    await queryRunner.dropIndex("users", "IDX_GITHUB_ID");

    // 删除添加的字段
    await queryRunner.query(`
      ALTER TABLE users
      DROP COLUMN github_bio,
      DROP COLUMN github_avatar_url,
      DROP COLUMN github_login,
      DROP COLUMN github_id
    `);
  }
}
