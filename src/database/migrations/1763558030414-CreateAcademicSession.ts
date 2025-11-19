import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class CreateAcademicSessionTable1700000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'academic_sessions',
        columns: [
          new TableColumn({
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          }),
          new TableColumn({
            name: 'name',
            type: 'varchar',
            length: '100',
            isUnique: true,
          }),
          new TableColumn({
            name: 'start_date',
            type: 'date',
          }),
          new TableColumn({
            name: 'end_date',
            type: 'date',
          }),
          new TableColumn({
            name: 'status',
            type: 'enum',
            enum: ['Active', 'Inactive'],
            default: "'Inactive'",
          }),
          new TableColumn({
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          }),
          new TableColumn({
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          }),
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('academic_sessions');
  }
}
