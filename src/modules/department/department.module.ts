import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DepartmentController } from './controllers/department.controller';
import { Department } from './entities/department.entity';
import { DepartmentModelAction } from './model-actions/department.actions';
import { DepartmentService } from './services/department.service';

@Module({
  imports: [TypeOrmModule.forFeature([Department])],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentModelAction],
  exports: [DepartmentModelAction, DepartmentService],
})
export class DepartmentModule {}
