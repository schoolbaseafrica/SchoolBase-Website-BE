import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { RoomModelAction } from '../model-actions/room-model-actions';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomModelAction: RoomModelAction,
    private readonly datasource: DataSource,
  ) {}

  async create(createRoomDto: CreateRoomDTO) {
    const existingRoom = await this.findByName(
      this.sanitizedName(createRoomDto.name),
    );

    if (existingRoom) {
      throw new ConflictException(sysMsg.DUPLICATE_ROOM_NAME);
    }

    let streamEntities: Stream[] = [];

    if (createRoomDto.streams && createRoomDto.streams.length > 0) {
      streamEntities = await this.validateStreams(createRoomDto.streams);
    }

    const newRoom = await this.roomModelAction.create({
      createPayload: {
        name: this.sanitizedName(createRoomDto.name),
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

    return { message: sysMsg.ROOM_CREATED_SUCCESSFULLY, ...newRoom };
  }

  private async validateStreams(streams: string[]) {
    const streamRepo = this.datasource.getRepository(Stream);
    const streamEntities = await streamRepo.findBy({
      id: In(streams),
    });

    if (streamEntities.length !== streams.length) {
      throw new NotFoundException(sysMsg.INVALID_STREAM_IDS);
    }

    return streamEntities;
  }

  private async findByName(name: string) {
    const room = await this.roomModelAction.get({
      identifierOptions: { name },
    });

    return room;
  }

  private sanitizedName(name: string) {
    return name.trim().toLowerCase();
  }
}
