import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { TermModule } from '../academic-term/term.module';
import { ClassModule } from '../class/class.module';
import { GradeModule } from '../grade/grade.module';
import { StudentModule } from '../student/student.module';

import { ResultController } from './controllers';
import { Result, ResultSubjectLine } from './entities';
import {
  ResultModelAction,
  ResultSubjectLineModelAction,
} from './model-actions';
import { ResultService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Result, ResultSubjectLine]),
    GradeModule,
    StudentModule,
    ClassModule,
    TermModule,
    AcademicSessionModule,
  ],
  controllers: [ResultController],
  providers: [ResultService, ResultModelAction, ResultSubjectLineModelAction],
  exports: [ResultService, ResultModelAction],
})
export class ResultModule {}
