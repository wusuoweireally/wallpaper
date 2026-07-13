import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddWallpaperReviewWorkflow1730000000000 implements MigrationInterface {
  name = "AddWallpaperReviewWorkflow1730000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;

    const table = await queryRunner.getTable("wallpapers");
    if (!table?.findColumnByName("review_note")) {
      await queryRunner.addColumn(
        "wallpapers",
        new TableColumn({
          name: "review_note",
          type: "varchar",
          length: "500",
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName("reviewed_by")) {
      await queryRunner.addColumn(
        "wallpapers",
        new TableColumn({
          name: "reviewed_by",
          type: "bigint",
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName("reviewed_at")) {
      await queryRunner.addColumn(
        "wallpapers",
        new TableColumn({
          name: "reviewed_at",
          type: "datetime",
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable("wallpapers"))) return;
    for (const column of ["reviewed_at", "reviewed_by", "review_note"]) {
      if (await queryRunner.hasColumn("wallpapers", column)) {
        await queryRunner.dropColumn("wallpapers", column);
      }
    }
  }
}
