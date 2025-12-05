import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FeesModule } from '../fees/fees.module';
import { TimetableModule } from '../timetable/timetable.module';

import { NotificationController } from './controller';
import { Notification } from './entities/notification.entity';
import { NotificationModelAction } from './model-actions';
import { NotificationService, FeeNotificationService } from './services';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    forwardRef(() => FeesModule),
    forwardRef(() => TimetableModule),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationModelAction,
    FeeNotificationService,
  ],
  exports: [
    NotificationModelAction,
    NotificationService,
    FeeNotificationService,
  ],
})
export class NotificationModule {}
