import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWaitlistTable1731808800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "waitlist" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "firstName" varchar(120) NOT NULL,
        "lastName" varchar(120) NOT NULL,
        "email" varchar(180) NOT NULL UNIQUE,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_waitlist_email" ON "waitlist" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_waitlist_email"`);
    await queryRunner.query(`DROP TABLE "waitlist"`);
  }
}
