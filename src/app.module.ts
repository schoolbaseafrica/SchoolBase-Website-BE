import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth-service/auth.module';
import { UserModule } from './user-service/user.module';
import { AcademicModule } from './academic-service/academic.module';
import { AttendanceModule } from './attendance-service/attendance.module';
import { FeeModule } from './fee-service/fee.module';
import { NotificationModule } from './notification-service/notification.module';
import { AnalyticsModule } from './analytics-service/analytics.module';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/exceptions/filters/global-exception.filter';

@Module({
  imports: [
    AuthModule,
    UserModule,
    AcademicModule,
    AttendanceModule,
    FeeModule,
    NotificationModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
