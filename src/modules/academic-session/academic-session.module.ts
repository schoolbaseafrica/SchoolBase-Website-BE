import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AcademicSessionController } from './academic-session.controller';
import { AcademicSessionService } from './academic-session.service';
import { AcademicSession } from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicSession])],
  controllers: [AcademicSessionController],
  providers: [AcademicSessionService, AcademicSessionModelAction],
})
export class AcademicSessionModule {}
