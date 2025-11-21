import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

@Entity('schools')
export class School extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  @IsString()
  @Length(2, 150)
  name: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(5, 255)
  address: string;

  @Column({ nullable: true })
  @IsOptional()
  @IsUrl()
  logo_url?: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  @Matches(/^[0-9+\-()\s]*$/, {
    message: 'phone must contain only numbers and valid phone characters',
  })
  phone: string;

  @Column({ comment: 'Dedicated DB connection', type: 'text' })
  @IsString()
  @Length(10, 500)
  database_url: string;
}
