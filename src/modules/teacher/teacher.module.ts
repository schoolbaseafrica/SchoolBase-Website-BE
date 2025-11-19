import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teacher } from './entities/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teacher])],
  exports: [TypeOrmModule], // Export to allow other modules to relate to Teacher
})
export class TeachersModule {}