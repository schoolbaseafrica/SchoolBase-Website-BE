import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { ClassStudent } from '../class/entities/class-student.entity';
import { ClassSubject } from '../class/entities/class-subject.entity';
import { ClassStudentModelAction } from '../class/model-actions/class-student.action';
import { ClassSubjectModelAction } from '../class/model-actions/class-subject.action';
import { FileModule } from '../shared/file/file.module';
import { Student } from '../student/entities/student.entity';
import { StudentModelAction } from '../student/model-actions/student-actions';
import { StudentModule } from '../student/student.module';
import { UserModule } from '../user/user.module';

import { Parent } from './entities/parent.entity';
import { ParentModelAction } from './model-actions/parent-actions';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Parent, Student, ClassStudent, ClassSubject]),
    FileModule,
    UserModule,
    StudentModule,
  ],
  controllers: [ParentController],
  providers: [
    ParentService,
    ParentModelAction,
    RateLimitGuard,
    StudentModelAction,
    ClassStudentModelAction,
    ClassSubjectModelAction,
  ],
  exports: [ParentService, ParentModelAction],
})
export class ParentModule {}
