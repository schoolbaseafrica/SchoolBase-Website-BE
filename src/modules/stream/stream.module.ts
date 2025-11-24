import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClassModule } from '../class/class.module';
import { Student } from '../student/entities/student.entity';

import { StreamController } from './controllers/stream.controller';
import { Stream } from './entities/stream.entity';
import { StreamModelAction } from './model-actions/stream.model-action';
import { StreamService } from './services/stream.service';

@Module({
  imports: [TypeOrmModule.forFeature([Stream, Student]), ClassModule],
  controllers: [StreamController],
  providers: [StreamService, StreamModelAction],
  exports: [StreamModelAction],
})
export class StreamModule {}
