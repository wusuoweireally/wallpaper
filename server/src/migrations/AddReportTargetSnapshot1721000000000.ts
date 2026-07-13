import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddReportTargetSnapshot1721000000000 implements MigrationInterface {
  name = "AddReportTargetSnapshot1721000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (
      !(await queryRunner.hasTable("reports")) ||
      (await queryRunner.hasColumn("reports", "target_snapshot"))
    ) {
      return;
    }

    await queryRunner.addColumn(
      "reports",
      new TableColumn({
        name: "target_snapshot",
        type: "json",
        isNullable: true,
      }),
    );

    if (await queryRunner.hasTable("posts")) {
      await queryRunner.query(`
        UPDATE reports report
        INNER JOIN posts post
          ON report.target_type = 'post' AND report.target_id = post.id
        SET report.target_snapshot = JSON_OBJECT(
          'title', post.title,
          'content', post.content,
          'authorId', post.author_id,
          'postId', post.id
        )
        WHERE report.target_snapshot IS NULL
      `);
    }

    if (
      (await queryRunner.hasTable("comments")) &&
      (await queryRunner.hasTable("posts"))
    ) {
      await queryRunner.query(`
        UPDATE reports report
        INNER JOIN comments comment
          ON report.target_type = 'comment' AND report.target_id = comment.id
        INNER JOIN posts post ON post.id = comment.post_id
        SET report.target_snapshot = JSON_OBJECT(
          'title', post.title,
          'content', comment.content,
          'authorId', comment.author_id,
          'postId', comment.post_id
        )
        WHERE report.target_snapshot IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (
      (await queryRunner.hasTable("reports")) &&
      (await queryRunner.hasColumn("reports", "target_snapshot"))
    ) {
      await queryRunner.dropColumn("reports", "target_snapshot");
    }
  }
}
