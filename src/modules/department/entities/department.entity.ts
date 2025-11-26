import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { Subject } from '../../subject/entities/subject.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @ManyToMany(() => Subject, (subject) => subject.departments)
  @JoinTable({
    name: 'subject_departments',
    joinColumn: { name: 'department_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'subject_id', referencedColumnName: 'id' },
  })
  subjects: Subject[];
}
