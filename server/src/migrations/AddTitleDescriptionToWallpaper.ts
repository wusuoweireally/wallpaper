import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTitleDescriptionToWallpaper1714900000
  implements MigrationInterface
{
  name = "AddTitleDescriptionToWallpaper1714900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`wallpapers\` ADD \`title\` varchar(200) NULL COMMENT '壁纸标题' AFTER \`file_url\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallpapers\` ADD \`description\` text NULL COMMENT '壁纸描述' AFTER \`title\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`wallpapers\` DROP COLUMN \`description\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`wallpapers\` DROP COLUMN \`title\``,
    );
  }
}
