import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { SessionModule } from '../session/session.module';

import { SuperAdmin } from './entities/superadmin.entity';
import { SuperadminModelAction } from './model-actions/superadmin-actions';
import { SuperadminController } from './superadmin.controller';
import { SuperadminService } from './superadmin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SuperAdmin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<JwtModuleOptions> => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>('TOKEN_ACCESS_DURATION') ??
            '120m') as string,
        },
      }),
      inject: [ConfigService],
    }),
    SessionModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService, SuperadminModelAction, RateLimitGuard],
  exports: [SuperadminModelAction],
})
export class SuperadminModule {}
