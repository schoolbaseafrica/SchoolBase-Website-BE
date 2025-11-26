import { IsEmail } from 'class-validator';
import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { School } from '../../school/entities/school.entity';

@Entity('databases')
export class Database extends BaseEntity {
  @Column({ unique: true, name: 'school_email' })
  @IsEmail()
  school_email: string; //foreign key to school

  @Column({ name: 'database_name' })
  database_name: string;

  @Column({ name: 'database_host' })
  database_host: string;

  @Column({ name: 'database_username' })
  database_username: string;

  @Column({ name: 'database_port' })
  database_port: number;

  @Column({ name: 'database_password' })
  database_password: string;

  // --- Relationships ---
  @OneToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'email', referencedColumnName: 'email' })
  school: School;
}
