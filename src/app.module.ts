import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from './common/exceptions/filters/global-exception.filter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LoggerModule } from './common/logger.module';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { UserModule } from './modules/user/user.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: String(config.get<string>('DB_PASS') || 'postgres'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        migrationsRun: false,
        synchronize: false,
      }),
    }),
    UserModule,
    WaitlistModule,
  ],
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
