import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubjectController } from './controllers/subject.controller';
import { Subject } from './entities/subject.entity';
import { SubjectModelAction } from './model-actions/subject.actions';
import { SubjectService } from './services/subject.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  controllers: [SubjectController],
  providers: [SubjectService, SubjectModelAction],
  exports: [SubjectModelAction, SubjectService],
})
export class SubjectModule {}
