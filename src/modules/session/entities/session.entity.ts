import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { User } from '../../user/entities/user.entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @Column()
  user_id!: string;

  @Column()
  expires_at!: Date;

  @Column({ type: 'text' })
  refresh_token!: string;

  @Column({ default: 'jwt' })
  provider!: string;

  @Column({ default: true })
  is_active!: boolean;

  @Column({ nullable: true })
  revoked_at?: Date;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
