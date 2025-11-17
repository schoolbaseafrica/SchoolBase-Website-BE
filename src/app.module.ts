import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './common/logger.module';
import { GlobalExceptionFilter } from './common/exceptions/filters/global-exception.filter';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [LoggerModule, UserModule],
  controllers: [AppController],
  providers: [
    AppService,
    LoggingInterceptor,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}