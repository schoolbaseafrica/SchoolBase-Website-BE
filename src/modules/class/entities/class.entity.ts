import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Unique,
  OneToOne,
} from 'typeorm';

import { BaseEntity } from '../../../entities/base-entity';
import { AcademicSession } from '../../academic-session/entities/academic-session.entity';
import { Stream } from '../../stream/entities/stream.entity';
import { Timetable } from '../../timetable/entities/timetable.entity';

import { ClassTeacher } from './class-teacher.entity';

@Unique(['name', 'arm', 'academicSession'])
@Entity()
export class Class extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  stream?: string;

  @Column({ nullable: true })
  arm?: string;

  @ManyToOne(() => AcademicSession, { nullable: false })
  @JoinColumn({ name: 'academic_session_id' })
  academicSession: AcademicSession;

  @OneToMany(() => ClassTeacher, (assignment) => assignment.class)
  teacher_assignment: ClassTeacher[];

  @OneToMany(() => Stream, (stream) => stream.class)
  streams: Stream[];

  @OneToOne(() => Timetable, (timetable) => timetable.class)
  timetable?: Timetable;
}
