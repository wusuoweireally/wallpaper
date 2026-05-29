import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 为 users.role 枚举新增 'super_admin' 值。
 *
 * 背景：认证授权加固引入了 SUPER_ADMIN 角色（仅超级管理员可创建/降级其他管理员、
 * 修改角色等）。生产环境关闭了 synchronize，因此需要本迁移显式扩展 enum，
 * 否则种子服务将无法把初始管理员写为 super_admin。
 */
export class AddSuperAdminRole1717000000000 implements MigrationInterface {
  name = "AddSuperAdminRole1717000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('user', 'admin', 'super_admin')
      NOT NULL DEFAULT 'user' COMMENT '用户角色'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 回滚前先将 super_admin 降级为 admin，避免被收缩的枚举拒绝
    await queryRunner.query(`
      UPDATE users SET role = 'admin' WHERE role = 'super_admin'
    `);
    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('user', 'admin')
      NOT NULL DEFAULT 'user' COMMENT '用户角色'
    `);
  }
}
