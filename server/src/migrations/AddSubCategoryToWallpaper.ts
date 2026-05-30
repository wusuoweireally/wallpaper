import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubCategoryToWallpaper1715000000000 implements MigrationInterface {
  name = "AddSubCategoryToWallpaper1715000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    if (!(await queryRunner.hasColumn("wallpapers", "sub_category"))) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` ADD \`sub_category\` varchar(50) NULL COMMENT '子分类: nature-自然, city-城市, abstract-抽象, cyberpunk-赛博朋克, minimal-极简, dark-暗黑, cute-可爱, game-游戏, movie-影视, other-其他' AFTER \`category\``,
      );
    }

    const table = await queryRunner.getTable("wallpapers");
    const hasIndex = table?.indices.some(
      (index) => index.name === "idx_sub_category",
    );
    if (!hasIndex) {
      await queryRunner.query(
        `CREATE INDEX \`idx_sub_category\` ON \`wallpapers\` (\`sub_category\`)`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    const table = await queryRunner.getTable("wallpapers");
    if (table?.indices.some((index) => index.name === "idx_sub_category")) {
      await queryRunner.query(
        `DROP INDEX \`idx_sub_category\` ON \`wallpapers\``,
      );
    }
    if (await queryRunner.hasColumn("wallpapers", "sub_category")) {
      await queryRunner.query(
        `ALTER TABLE \`wallpapers\` DROP COLUMN \`sub_category\``,
      );
    }
  }
}
