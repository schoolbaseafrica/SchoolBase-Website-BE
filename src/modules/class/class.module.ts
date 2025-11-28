import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { StudentModule } from '../student/student.module';

import { ClassController } from './controllers/class.controller';
import { ClassStudent } from './entities/class-student.entity';
import { ClassTeacher } from './entities/class-teacher.entity';
import { Class } from './entities/class.entity';
import { ClassStudentModelAction } from './model-actions/class-student.action';
import { ClassTeacherModelAction } from './model-actions/class-teacher.action';
import { ClassModelAction } from './model-actions/class.actions';
import { ClassService } from './services/class.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Class, ClassTeacher, ClassStudent]),
    AcademicSessionModule,
    StudentModule,
  ],
  controllers: [ClassController],
  providers: [
    ClassService,
    ClassModelAction,
    ClassTeacherModelAction,
    ClassStudentModelAction,
  ],
  exports: [ClassModelAction, ClassTeacherModelAction, ClassStudentModelAction],
})
export class ClassModule {}
