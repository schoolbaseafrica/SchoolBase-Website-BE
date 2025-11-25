import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RateLimitGuard } from '../../common/guards/rate-limit.guard';
import { FileModule } from '../shared/file/file.module';
import { UserModule } from '../user/user.module';

import { Parent } from './entities/parent.entity';
import { ParentModelAction } from './model-actions/parent-actions';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';

@Module({
  imports: [TypeOrmModule.forFeature([Parent]), FileModule, UserModule],
  controllers: [ParentController],
  providers: [ParentService, ParentModelAction, RateLimitGuard],
  exports: [ParentService, ParentModelAction],
})
export class ParentModule {}
