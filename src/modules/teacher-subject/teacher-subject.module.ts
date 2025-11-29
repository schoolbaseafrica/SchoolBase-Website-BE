import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TeacherSubject } from './entities/teacher-subject.entity';
import { TeacherSubjectModelAction } from './model-actions/teacher-subject.model-action';
import { TeacherSubjectController } from './teacher-subject.controller';
import { TeacherSubjectService } from './teacher-subject.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeacherSubject])],
  controllers: [TeacherSubjectController],
  providers: [TeacherSubjectService, TeacherSubjectModelAction],
  exports: [TeacherSubjectService, TeacherSubjectModelAction],
})
export class TeacherSubjectModule {}
