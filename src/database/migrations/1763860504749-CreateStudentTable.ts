import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudentTable1763800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL,
        "stream_id" uuid,
        CONSTRAINT "UQ_student_user" UNIQUE ("user_id"),
        CONSTRAINT "FK_student_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_student_stream" FOREIGN KEY ("stream_id") REFERENCES "stream"("id") ON DELETE SET NULL
      )
    `);

    const table = await queryRunner.getTable('users');
    if (table && table.findColumnByName('stream_id')) {
      await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stream_id"`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "students"`);
  }
}
