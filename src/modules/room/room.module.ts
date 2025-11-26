import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Stream } from '../stream/entities/stream.entity';

import { RoomController } from './controllers/room.controller';
import { Room } from './entities/room.entity';
import { RoomModelAction } from './model-actions/room-model-actions';
import { RoomService } from './services/room.service';

@Module({
  imports: [TypeOrmModule.forFeature([Room, Stream])],
  controllers: [RoomController],
  providers: [RoomService, RoomModelAction],
  exports: [RoomModelAction],
})
export class RoomModule {}
