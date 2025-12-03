import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionModule } from '../academic-session/academic-session.module';
import { ClassModule } from '../class/class.module';
import { ClassSubject } from '../class/entities/class-subject.entity';

import { SubjectController } from './controllers/subject.controller';
import { Subject } from './entities/subject.entity';
import { SubjectModelAction } from './model-actions/subject.actions';
import { SubjectService } from './services/subject.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subject, ClassSubject]),
    AcademicSessionModule,
    forwardRef(() => ClassModule),
  ],
  controllers: [SubjectController],
  providers: [SubjectService, SubjectModelAction],
  exports: [SubjectModelAction, SubjectService],
})
export class SubjectModule {}
