import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { StudentModule } from '../student/student.module';
import { TeachersModule } from '../teacher/teacher.module';

import { ClassSubjectController } from './controllers/class-subject.controller';
import { ClassController } from './controllers/class.controller';
import { Class, ClassStudent, ClassTeacher, ClassSubject } from './entities';
import {
  ClassModelAction,
  ClassTeacherModelAction,
  ClassStudentModelAction,
  ClassSubjectModelAction,
} from './model-actions';
import { ClassSubjectService } from './services/class-subject.service';
import { ClassService } from './services/class.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, ClassTeacher, ClassSubject, ClassStudent]),
    AcademicSessionModule,
    StudentModule,
    TeachersModule,
  ],
  controllers: [ClassController, ClassSubjectController],
  providers: [
    ClassService,
    ClassModelAction,
    ClassTeacherModelAction,
    ClassStudentModelAction,
    ClassSubjectModelAction,
    ClassSubjectService,
  ],
  exports: [ClassModelAction, ClassTeacherModelAction, ClassStudentModelAction],
})
export class ClassModule {}
