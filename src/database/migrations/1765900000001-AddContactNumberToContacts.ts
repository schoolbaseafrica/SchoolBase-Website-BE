import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactNumberToContacts1765900000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contacts"
      ADD COLUMN IF NOT EXISTS "contact_number" varchar(20)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "contacts" DROP COLUMN IF EXISTS "contact_number"
    `);
  }
}
