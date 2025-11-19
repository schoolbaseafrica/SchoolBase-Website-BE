import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StreamController } from './controllers/stream.controller';
import { Class } from './entities/class.entity';
import { Stream } from './entities/stream.entity';
import { StreamService } from './services/stream.service';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Stream])],
  controllers: [StreamController],
  providers: [StreamService],
})
export class AcademicModule {}
