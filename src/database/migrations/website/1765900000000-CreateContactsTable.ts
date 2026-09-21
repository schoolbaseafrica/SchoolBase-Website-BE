import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactsTable1765900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."contacts_status_enum" AS ENUM(
          'PENDING',
          'IN_PROGRESS',
          'RESOLVED',
          'CLOSED'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "contacts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "full_name" varchar(100) NOT NULL,
        "email" varchar(255) NOT NULL,
        "school_name" varchar(200),
        "message" text NOT NULL,
        "status" "public"."contacts_status_enum" NOT NULL DEFAULT 'PENDING',
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."contacts_status_enum"`,
    );
  }
}
