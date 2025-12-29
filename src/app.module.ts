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
import { ContactModule } from './modules/contact/contact.module';
import { EmailModule } from './modules/email/email.module';
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
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('env');
        const isProduction = env === 'production';
        const isStaging = env === 'staging';
        const isDevelopment = !isProduction && !isStaging;

        return {
          type: 'postgres',
          host:
            config.get<string>('database.host') ||
            config.get<string>('DB_HOST'),
          port:
            config.get<number>('database.port') ||
            config.get<number>('DB_PORT'),
          username:
            config.get<string>('database.user') ||
            config.get<string>('DB_USER'),
          password: String(
            config.get<string>('database.pass') ||
              config.get<string>('DB_PASS') ||
              'postgres',
          ),
          database:
            config.get<string>('database.name') ||
            config.get<string>('DB_NAME'),

          // Auto-load entities from TypeOrmModule.forFeature() in all modules
          autoLoadEntities: true,

          // CRITICAL: Only synchronize in development
          // In production, schema changes MUST go through migrations
          synchronize: isDevelopment,

          // Automatically run pending migrations on application start in production
          migrationsRun: isProduction || isStaging,

          // Migration configuration
          migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
          migrationsTableName: 'migrations',

          // SSL configuration for production databases
          ssl: config.get<boolean>('database.ssl')
            ? { rejectUnauthorized: false }
            : false,

          // Logging configuration
          logging: isDevelopment ? true : ['error', 'warn', 'migration'],
        };
      },
    }),
    ContactModule,
    EmailModule,
    WaitlistModule,
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
