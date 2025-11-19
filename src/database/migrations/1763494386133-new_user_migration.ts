import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewUserMigration1763494386133 implements MigrationInterface {
  name = 'NewUserMigration1763494386133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the waitlist index if it exists
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_waitlist_email"`);

    // Create enum type if it does not exist
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
              CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
          END IF;
      END$$;
    `);

    // Create users table if it does not exist
    await queryRunner.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
              CREATE TABLE "users" (
                  "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                  "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                  "first_name" character varying NOT NULL,
                  "last_name" character varying NOT NULL,
                  "middle_name" character varying,
                  "gender" character varying NOT NULL,
                  "dob" date NOT NULL,
                  "email" character varying NOT NULL,
                  "phone" character varying NOT NULL,
                  "role" "public"."users_role_enum" array NOT NULL DEFAULT '{STUDENT}',
                  "password" character varying NOT NULL,
                  "is_active" boolean NOT NULL DEFAULT true,
                  "last_login_at" TIMESTAMP,
                  "reset_token" character varying,
                  "reset_token_expiry" TIMESTAMP,
                  CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                  CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
              );
          END IF;
      END$$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the users table if it exists
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enum type if it exists
    await queryRunner.query(`DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'users_role_enum') THEN
          DROP TYPE "public"."users_role_enum";
        END IF;
      END$$;
    `);

    // Recreate waitlist index if needed
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_waitlist_email" ON "waitlist" ("email")
    `);
  }
}
