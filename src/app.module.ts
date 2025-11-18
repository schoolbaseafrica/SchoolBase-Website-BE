import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from './common/exceptions/filters/global-exception.filter';
import { LoggerModule } from './common/logger.module';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { EmailModule } from './modules/email/email.module';
import { SchoolModule } from './modules/school/school.module';
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
    AuthModule,
    WaitlistModule,
    UserModule,
    EmailModule,
    SchoolModule,
    AuthModule,
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
