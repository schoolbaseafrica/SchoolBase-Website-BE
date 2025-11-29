import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { SuperadminSession } from '../session/entities/superadmin-session.entity';

export enum Role {
  SUPERADMIN = 'SUPERADMIN',
}

@Entity('superadmin')
export class SuperAdmin extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @Length(2, 50)
  first_name: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @Length(2, 50)
  last_name: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  school_name: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @Column({ nullable: true, type: 'varchar' })
  reset_token: string;

  @Column({ nullable: true, type: 'date' })
  reset_token_expiration: Date;

  @Column({ type: 'enum', enum: Role, default: Role.SUPERADMIN })
  role: Role;

  @OneToMany(() => SuperadminSession, (session) => session.superadmin)
  sessions!: SuperadminSession[];
}
