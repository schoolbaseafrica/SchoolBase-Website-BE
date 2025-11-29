import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Student } from '../../student/entities/student.entity';
import { User } from '../../user/entities/user.entity';

@Entity('parents')
export class Parent extends BaseEntity {
  @Column({ type: 'uuid', unique: true, name: 'user_id' })
  user_id: string;

  @Column({ name: 'photo_url', nullable: true })
  photo_url: string;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  is_active: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: null,
    name: 'deleted_at',
  })
  deleted_at: Date | null;

  // --- Relationships ---
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @OneToMany(() => Student, (student) => student.parent)
  students: Student[];
}
