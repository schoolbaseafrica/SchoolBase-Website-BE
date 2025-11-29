import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

@Entity('superadmin')
export class SuperAdmin extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @Length(2, 50)
  firstName: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @Length(2, 50)
  lastName: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @IsNotEmpty()
  schoolName: string;

  @Column({ nullable: true })
  password: string;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ nullable: true, type: 'varchar' })
  resetToken: string;

  @Column({ nullable: true, type: 'date' })
  resetTokenExpiration: Date;
}
