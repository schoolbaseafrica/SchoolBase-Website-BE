import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Term } from '../academic-term/entities/term.entity';
import { TermModule } from '../academic-term/term.module';
import { AuthModule } from '../auth/auth.module';

import { AcademicSessionController } from './academic-session.controller';
import { AcademicSessionService } from './academic-session.service';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

@Module({
  imports: [
    TypeOrmModule.forFeature([AcademicSession, Term]),
    AuthModule,
    TermModule,
  ],
  controllers: [AcademicSessionController],
  providers: [AcademicSessionService, AcademicSessionModelAction],
  exports: [AcademicSessionModelAction],
})
export class AcademicSessionModule {}
