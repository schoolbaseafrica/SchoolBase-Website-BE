import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Stream } from '../stream/entities/stream.entity';

import { Room } from './entities/room.entity';
import { RoomModelAction } from './model-actions/room-model-actions';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Stream])],
  controllers: [RoomController],
  providers: [RoomService, RoomModelAction],
  exports: [RoomModelAction],
})
export class RoomModule {}
