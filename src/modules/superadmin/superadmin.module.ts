import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

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
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '120m' },
      }),
      inject: [ConfigService],
    }),
    SessionModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService, SuperadminModelAction],
  exports: [SuperadminModelAction],
})
export class SuperadminModule {}
