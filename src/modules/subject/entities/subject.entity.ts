import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Department } from '../../department/entities/department.entity';

@Entity('subjects')
export class Subject extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @ManyToMany(() => Department, (department) => department.subjects)
  @JoinTable({
    name: 'subject_departments',
    joinColumn: { name: 'subject_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'department_id', referencedColumnName: 'id' },
  })
  departments: Department[];

  @Column({ default: true })
  is_active: boolean;
}
