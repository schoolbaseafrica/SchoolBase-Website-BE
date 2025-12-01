import { Column, Entity, OneToMany, Unique } from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { ClassSubject } from '../../class/entities/class-subject.entity';

@Entity('subjects')
@Unique(['name'])
export class Subject extends BaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name: string;

  @OneToMany(() => ClassSubject, (classSubject) => classSubject.subject)
  classSubjects: ClassSubject[];
}
