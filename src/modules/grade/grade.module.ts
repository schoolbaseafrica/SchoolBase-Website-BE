import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Term } from '../academic-term/entities/term.entity';
import { Class, ClassSubject, ClassStudent } from '../class/entities';
import { StudentModule } from '../student/student.module';

import { GradeController } from './controllers/grade.controller';
import { Grade, GradeSubmission } from './entities';
import { GradeModelAction, GradeSubmissionModelAction } from './model-actions';
import { GradeService } from './services/grade.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Grade,
      GradeSubmission,
      ClassSubject,
      ClassStudent,
      Term,
      Class,
    ]),
    StudentModule,
  ],
  controllers: [GradeController],
  providers: [GradeService, GradeModelAction, GradeSubmissionModelAction],
  exports: [GradeService, GradeModelAction, GradeSubmissionModelAction],
})
export class GradeModule {}
