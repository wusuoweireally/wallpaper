import { MigrationInterface, QueryRunner } from "typeorm";

/** users 加 token_version：修改密码后使已签发的 JWT 全部失效 */
export class AddTokenVersionToUser1758000000001 implements MigrationInterface {
  name = "AddTokenVersionToUser1758000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) return;
    if (!(await queryRunner.hasColumn("users", "token_version"))) {
      await queryRunner.query(
        "ALTER TABLE `users` ADD COLUMN `token_version` int NOT NULL DEFAULT 0 COMMENT 'JWT 凭证版本号' AFTER `status`",
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("users"))) return;
    if (await queryRunner.hasColumn("users", "token_version")) {
      await queryRunner.query(
        "ALTER TABLE `users` DROP COLUMN `token_version`",
      );
    }
  }
}
