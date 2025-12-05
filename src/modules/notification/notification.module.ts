import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NotificationController } from './controller/notification.controller';
import { Notification } from './entities/notification.entity';
import { NotificationModelAction } from './model-actions/notification.model-action';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationModelAction],
  exports: [NotificationModelAction],
})
export class NotificationModule {}
