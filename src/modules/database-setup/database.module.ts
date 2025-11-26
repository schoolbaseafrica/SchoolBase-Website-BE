import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseController } from './database.controller';
import { DatabaseService } from './database.service';
import { Database } from './entities/database.entity';
import { DatabaseModelAction } from './model-actions/database-actions';

@Module({
  imports: [TypeOrmModule.forFeature([Database])],
  controllers: [DatabaseController],
  providers: [DatabaseService, DatabaseModelAction],
})
export class DatabaseModule {}
