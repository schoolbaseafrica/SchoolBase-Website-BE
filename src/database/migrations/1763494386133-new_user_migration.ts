import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewUserMigration1763494386133 implements MigrationInterface {
  name = 'NewUserMigration1763494386133';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_waitlist_email"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'TEACHER', 'STUDENT', 'PARENT')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "first_name" character varying NOT NULL, "last_name" character varying NOT NULL, "middle_name" character varying, "gender" character varying NOT NULL, "dob" date NOT NULL, "email" character varying NOT NULL, "phone" character varying NOT NULL, "role" "public"."users_role_enum" array NOT NULL DEFAULT '{STUDENT}', "password" character varying NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "last_login_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_waitlist_email" ON "waitlist" ("email") `,
    );
  }
}
