import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * 基础 schema 迁移。
 *
 * 这个项目早期依赖 TypeORM synchronize 创建基础表，后来关闭了自动同步，
 * 但仓库里只有增量迁移，空库启动会在 seed 查询 users 表时崩溃。
 *
 * 为了兼容已有数据库，本迁移只在业务表完全不存在时执行一次 schema 初始化；
 * 已有业务表的环境保持不动，后续增量迁移继续按需补字段。
 */
export class InitialSchema1600000000000 implements MigrationInterface {
  name = "InitialSchema1600000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = await queryRunner.query(
      "SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> 'migrations'",
    );

    if (Array.isArray(tables) && tables.length > 0) {
      return;
    }

    await queryRunner.connection.synchronize(false);
  }

  public async down(): Promise<void> {
    // 基础 schema 回滚会删除所有业务表，风险过高；需要回滚时请使用数据库备份恢复。
  }
}
