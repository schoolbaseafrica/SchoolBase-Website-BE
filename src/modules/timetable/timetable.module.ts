import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClassModule } from '../class/class.module';
import { Class } from '../class/entities/class.entity';
import { NotificationModule } from '../notification/notification.module';
import { Room } from '../room/entities/room.entity';
import { Subject } from '../subject/entities/subject.entity';
import { Teacher } from '../teacher/entities/teacher.entity';

import { Schedule } from './entities/schedule.entity';
import { Timetable } from './entities/timetable.entity';
import { ScheduleModelAction } from './model-actions/schedule.model-action';
import { TimetableModelAction } from './model-actions/timetable.model-action';
import { TimetableValidationService } from './services/timetable-validation.service';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Timetable,
      Schedule,
      Class,
      Subject,
      Teacher,
      Room,
    ]),
    ClassModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [TimetableController],
  providers: [
    TimetableService,
    TimetableModelAction,
    ScheduleModelAction,
    TimetableValidationService,
  ],
  exports: [TimetableService, TimetableModelAction, ScheduleModelAction],
})
export class TimetableModule {}
