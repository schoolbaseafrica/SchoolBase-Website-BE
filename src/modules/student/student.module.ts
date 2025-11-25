import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentController } from './controllers';
import { Student } from './entities';
import { StudentModelAction } from './model-actions';
import { StudentService } from './services';

@Module({
  imports: [TypeOrmModule.forFeature([Student])],
  controllers: [StudentController],
  providers: [StudentService, StudentModelAction],
  exports: [StudentModelAction],
})
export class StudentModule {}
