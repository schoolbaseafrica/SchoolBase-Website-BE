import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../entities/base-entity';

@Entity({ name: 'invites' })
export class Invite extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ default: false })
  accepted: boolean;

  @CreateDateColumn()
  invitedAt: Date;
}
