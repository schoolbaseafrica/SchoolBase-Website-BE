import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Subject } from './entities/subject.entity';
import { SubjectController } from './subject.controller';
import { SubjectService } from './subject.service';

@Module({
  imports: [TypeOrmModule.forFeature([Subject])],
  controllers: [SubjectController],
  providers: [SubjectService],
})
export class SubjectModule {}
