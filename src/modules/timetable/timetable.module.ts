import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Class } from '../class/entities/class.entity';
import { Subject } from '../subject/entities/subject.entity';
import { Teacher } from '../teacher/entities/teacher.entity';

import { Timetable } from './entities/timetable.entity';
import { TimetableModelAction } from './model-actions/timetable.model-action';
import { TimetableValidationService } from './services/timetable-validation.service';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

@Module({
  imports: [TypeOrmModule.forFeature([Timetable, Class, Subject, Teacher])],
  controllers: [TimetableController],
  providers: [
    TimetableService,
    TimetableModelAction,
    TimetableValidationService,
  ],
  exports: [TimetableService, TimetableModelAction],
})
export class TimetableModule {}
