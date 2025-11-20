import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { FileModule } from '../shared/file/file.module';
import { User } from '../user/entities/user.entity';

import { Teacher } from './entities/teacher.entity';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Teacher, User]), // Must include both Teacher and User
    FileModule,
  ],
  controllers: [TeacherController],
  providers: [TeacherService, RateLimitGuard],
  exports: [TeacherService], // Export if other modules (like Class module) need to reference it
})
export class TeachersModule {}
