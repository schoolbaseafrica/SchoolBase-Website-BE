import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSession } from '../academic-session/entities';
import { AcademicSessionModelAction } from '../academic-session/model-actions/academic-session-actions';

import { Term } from './entities/term.entity';
import { TermModelAction } from './model-actions';
import { TermController } from './term.controller';
import { TermService } from './term.service';

@Module({
  imports: [TypeOrmModule.forFeature([Term, AcademicSession])],
  controllers: [TermController],
  providers: [TermService, TermModelAction, AcademicSessionModelAction],
  exports: [TermService, TermModelAction],
})
export class TermModule {}
