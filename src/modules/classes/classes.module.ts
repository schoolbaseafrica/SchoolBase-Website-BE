import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { ClassTeacher } from './entities/class-teacher.entity';
import { Class } from './entities/classes.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, ClassTeacher])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService], // Export if other modules need to find class info
})
export class ClassesModule {}
