import { Entity, Column, CreateDateColumn } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

@Entity({ name: 'invites' })
export class Invite extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  invitedAt: Date;

  @Column()
  role: string;

  @Column({ nullable: true })
  full_name: string;
}
