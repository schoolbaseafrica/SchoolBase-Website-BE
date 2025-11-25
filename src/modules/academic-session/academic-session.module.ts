import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';

import { AcademicSessionController } from './academic-session.controller';
import { AcademicSessionService } from './academic-session.service';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicSession]), AuthModule],
  controllers: [AcademicSessionController],
  providers: [AcademicSessionService, AcademicSessionModelAction],
  exports: [AcademicSessionModelAction],
})
export class AcademicSessionModule {}
