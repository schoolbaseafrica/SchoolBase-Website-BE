import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from '../../../entities/base-entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  expiresAt!: Date;

  @Column({ nullable: true })
  refreshToken?: string;

  @Column({ default: 'session' })
  provider!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  revokedAt?: Date;
  
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

}