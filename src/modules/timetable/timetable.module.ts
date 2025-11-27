import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Timetable } from './entities/timetable.entity';
import { TimetableModelAction } from './model-actions/timetable.model-action';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

@Module({
  imports: [TypeOrmModule.forFeature([Timetable])],
  controllers: [TimetableController],
  providers: [TimetableService, TimetableModelAction],
  exports: [TimetableService, TimetableModelAction],
})
export class TimetableModule {}
