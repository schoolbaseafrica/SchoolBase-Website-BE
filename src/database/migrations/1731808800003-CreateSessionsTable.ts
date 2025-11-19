import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionsTable1731808800003 implements MigrationInterface {
  name = 'CreateSessionsTable1731808800003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
          CREATE TABLE "sessions" (
            "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            "user_id" uuid NOT NULL,
            "expires_at" TIMESTAMP NOT NULL,
            "refresh_token" TEXT NOT NULL,
            "provider" VARCHAR DEFAULT 'jwt',
            "is_active" BOOLEAN DEFAULT true,
            "revoked_at" TIMESTAMP,
            CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
          );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "sessions";`);
    }

}
