import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';
import { Stream } from '../stream/entities/stream.entity'; // Ensure this path is correct

import { CreateRoomDTO } from './dto/create-room-dto';
import { RoomModelAction } from './model-actions/room-model-actions';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomModelAction: RoomModelAction,
    private readonly datasource: DataSource,
  ) {}

  async create(createRoomDto: CreateRoomDTO) {
    const roomName = createRoomDto.name.trim().toLowerCase();

    const existingRoom = await this.roomModelAction.get({
      identifierOptions: { name: roomName },
    });

    if (existingRoom) {
      throw new ConflictException(sysMsg.DUPLICATE_ROOM_NAME);
    }

    let streamEntities: Stream[] = [];

    if (createRoomDto.streams && createRoomDto.streams.length > 0) {
      const streamRepo = this.datasource.getRepository(Stream);
      streamEntities = await streamRepo.findBy({
        id: In(createRoomDto.streams),
      });

      if (streamEntities.length !== createRoomDto.streams.length) {
        throw new NotFoundException(sysMsg.INVALID_STREAM_IDS);
      }
    }

    const newRoom = await this.roomModelAction.create({
      createPayload: {
        name: roomName,
        type: createRoomDto.type,
        capacity: createRoomDto.capacity,
        location: createRoomDto.location,
        building: createRoomDto.building,
        floor: createRoomDto.floor,
        description: createRoomDto.description,
        streams: streamEntities,
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    return {
      status_code: HttpStatus.CREATED,
      message: sysMsg.ROOM_CREATED_SUCCESSFULLY,
      data: newRoom,
    };
  }
}
