import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAcademicSessionAndTerms1732800000000
  implements MigrationInterface
{
  name = 'UpdateAcademicSessionAndTerms1732800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to academic_sessions table
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "academic_year" varchar(50) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" ADD "description" text`,
    );

    // Update terms table to add Entity decorator and new columns
    await queryRunner.query(
      `CREATE TABLE "terms_new" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "session_id" uuid NOT NULL, "name" character varying NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "is_current" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_terms" PRIMARY KEY ("id"))`,
    );

    // Copy data from old terms table if it exists
    await queryRunner.query(
      `INSERT INTO "terms_new" ("id", "created_at", "updated_at", "session_id", "name", "is_current") 
       SELECT "id", "created_at", "updated_at", "session_id", "name", "is_current" 
       FROM "terms" WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'terms')`,
    );

    // Drop old terms table if exists
    await queryRunner.query(`DROP TABLE IF EXISTS "terms"`);

    // Rename new table
    await queryRunner.query(`ALTER TABLE "terms_new" RENAME TO "terms"`);

    // Add foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "terms" ADD CONSTRAINT "FK_terms_academic_sessions" FOREIGN KEY ("session_id") REFERENCES "academic_sessions"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "terms" DROP CONSTRAINT "FK_terms_academic_sessions"`,
    );

    // Remove new columns from academic_sessions
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "description"`,
    );
    await queryRunner.query(
      `ALTER TABLE "academic_sessions" DROP COLUMN "academic_year"`,
    );

    // Recreate old terms table structure
    await queryRunner.query(
      `CREATE TABLE "terms_old" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "session_id" varchar NOT NULL, "name" character varying NOT NULL, "is_current" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_terms_old" PRIMARY KEY ("id"))`,
    );

    await queryRunner.query(
      `INSERT INTO "terms_old" ("id", "created_at", "updated_at", "session_id", "name", "is_current") 
       SELECT "id", "created_at", "updated_at", "session_id", "name", "is_current" 
       FROM "terms"`,
    );

    await queryRunner.query(`DROP TABLE "terms"`);
    await queryRunner.query(`ALTER TABLE "terms_old" RENAME TO "terms"`);
  }
}
