import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { School } from '../../school/entities/school.entity';

export enum InviteStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
  FAILED = 'failed',
}

@Entity({ name: 'invites' })
export class Invite extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  invited_at: Date;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column()
  role: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({
    type: 'enum',
    enum: InviteStatus,
    default: InviteStatus.PENDING,
  })
  status: InviteStatus;

  @Index()
  @Column()
  token_hash: string;

  @Column({ type: 'uuid', nullable: true })
  school_id: string;

  @ManyToOne(() => School, { nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: School;
}
