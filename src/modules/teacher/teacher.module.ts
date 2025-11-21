import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { FileModule } from '../shared/file/file.module';
import { UserModule } from '../user/user.module';

import { Teacher } from './entities/teacher.entity';
import { TeacherModelAction } from './model-actions/teacher-actions';
import { TeacherController } from './teacher.controller';
import { TeacherService } from './teacher.service';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher]), FileModule, UserModule],
  controllers: [TeacherController],
  providers: [TeacherService, TeacherModelAction, RateLimitGuard],
  exports: [TeacherService, TeacherModelAction],
})
export class TeachersModule {}
