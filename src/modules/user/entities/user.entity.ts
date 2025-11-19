import { Entity, Column, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';

import { Stream } from '../../academic/entities/stream.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
}

@Entity({ name: 'users' })
@Unique(['email'])
export class User extends BaseEntity {
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ nullable: true })
  middle_name: string;

  @Column()
  gender: string;

  @Column({ type: 'date' })
  dob: Date;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    array: true,
    default: [UserRole.STUDENT],
  })
  role: UserRole[];

  @Column()
  password: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true, nullable: true })
  is_verified?: boolean;

  @Column({ type: 'timestamp', nullable: true, default: null })
  last_login_at: Date | null;

  @Column({ nullable: true })
  reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expiry?: Date;

  // Added for Stream Management
  // Many students belong to one stream (e.g. 40 students in JSS1 A)
  @ManyToOne(() => Stream, (stream) => stream.students)
  @JoinColumn({ name: 'stream_id' })
  stream: Stream;
}
