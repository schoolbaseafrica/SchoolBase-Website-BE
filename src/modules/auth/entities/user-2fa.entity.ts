import { Entity, Column, JoinColumn, OneToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { User } from '../../user/entities/user.entity';

@Entity('user_2fa')
export class User2fa extends BaseEntity {
  @Column({ name: 'user_id', unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'two_fa_secret' })
  twoFaSecret: string;

  @Column({ name: 'two_fa_enabled', default: false })
  twoFaEnabled: boolean;

  @Column({ name: 'backup_codes', type: 'text', array: true, nullable: true })
  backupCodes?: string[];
}
