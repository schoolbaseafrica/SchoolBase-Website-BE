import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendanceTable1764706000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "attendance_status_enum" AS ENUM ('present', 'absent', 'late', 'excused');
    `);

    await queryRunner.query(`
      CREATE TABLE "attendance_records" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "schedule_id" uuid NOT NULL,
        "student_id" uuid NOT NULL,
        "session_id" uuid NOT NULL,
        "date" date NOT NULL,
        "status" "attendance_status_enum" NOT NULL DEFAULT 'absent',
        "marked_by" uuid NOT NULL,
        "marked_at" timestamp NOT NULL DEFAULT now(),
        "notes" text,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "PK_attendance_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_attendance_schedule" FOREIGN KEY ("schedule_id") REFERENCES "schedules"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendance_student" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_attendance_marked_by" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_attendance_student_schedule_date" UNIQUE ("student_id", "schedule_id", "date")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_schedule_id" ON "attendance_records" ("schedule_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_student_id" ON "attendance_records" ("student_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_date" ON "attendance_records" ("date");
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_attendance_session_id" ON "attendance_records" ("session_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_attendance_session_id"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_date"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_student_id"`);
    await queryRunner.query(`DROP INDEX "IDX_attendance_schedule_id"`);
    await queryRunner.query(`DROP TABLE "attendance_records"`);
    await queryRunner.query(`DROP TYPE "attendance_status_enum"`);
  }
}
