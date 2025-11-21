import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GlobalExceptionFilter } from './common/exceptions/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerModule } from './common/logger.module';
import configuration from './config/config';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { AcademicSessionModule } from './modules/academic-session/academic-session.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClassesModule } from './modules/classes/classes.module';
import { EmailModule } from './modules/email/email.module';
import { InviteModule } from './modules/invites/invites.module';
import { SchoolModule } from './modules/school/school.module';
import { SessionModule } from './modules/session/session.module';
import { SubjectModule } from './modules/subject/subject.module';
import { TeachersModule } from './modules/teacher/teacher.module';
import { UserModule } from './modules/user/user.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';

@Module({
  imports: [
    LoggerModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
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
        synchronize: true,
      }),
    }),
    AuthModule,
    WaitlistModule,
    UserModule,
    EmailModule,
    SchoolModule,
    SessionModule,
    AuthModule,
    TeachersModule,
    ClassesModule,
    InviteModule,
    AcademicSessionModule,
    SubjectModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    LoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
