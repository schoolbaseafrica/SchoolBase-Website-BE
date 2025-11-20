import { Entity, Column, Unique, OneToMany, OneToOne } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Session } from '../../sessions/entities/session.entity';

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

  @Column({ name: 'home_address', nullable: true })
  homeAddress: string; // Added field for Teacher/Student/Parent common data

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

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  // --- Relationship to Teacher ---
  // Using forward reference to avoid circular import
  @OneToOne('Teacher', 'user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  teacher: any; // TypeORM will resolve this at runtime - cannot type due to circular dependency

  @Column({ type: 'timestamp', nullable: true, default: null })
  last_login_at: Date | null;

  @Column({ nullable: true })
  reset_token?: string;

  @Column({ type: 'timestamp', nullable: true })
  reset_token_expiry?: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  deleted_at: Date | null;
}
