import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWaitlistTable1763398148395 implements MigrationInterface {
  name = 'CreateWaitlistTable1763398148395';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "waitlist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "first_name" character varying(120) NOT NULL, "last_name" character varying(120) NOT NULL, "email" character varying(180) NOT NULL, CONSTRAINT "UQ_2221cffeeb64bff14201bd5b3de" UNIQUE ("email"), CONSTRAINT "PK_973cfbedc6381485681d6a6916c" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "waitlist"`);
  }
}
