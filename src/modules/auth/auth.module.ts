import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmailModule } from '../email/email.module';
import { Session } from '../sessions/entities/session.entity';
import { SessionsController } from '../sessions/sessions.controller';
import { SessionsModule } from '../sessions/sessions.module';
import { SessionsService } from '../sessions/sessions.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    EmailModule,
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    SessionsModule,
    
  ],
  controllers: [AuthController, SessionsController],
  providers: [AuthService, UserService],
  exports: [AuthService],
})
export class AuthModule {}
