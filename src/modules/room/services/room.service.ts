import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { UpdateRoomDTO } from '../dto/update-room-dto';
import { Room } from '../entities/room.entity';
import { RoomModelAction } from '../model-actions/room-model-actions';

@Injectable()
export class RoomService {
  constructor(
    private readonly roomModelAction: RoomModelAction,
    private readonly datasource: DataSource,
  ) {}

  async create(createRoomDto: CreateRoomDTO) {
    const data = await this.datasource.transaction(async (manager) => {
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
          useTransaction: true,
          transaction: manager,
        },
      });

      return { ...newRoom, message: sysMsg.ROOM_CREATED_SUCCESSFULLY };
    });

    return data;
  }

  async findAll() {
    const { payload } = await this.roomModelAction.list({
      relations: { streams: true },
    });

    return {
      message: sysMsg.ROOM_LIST_RETRIEVED_SUCCESSFULLY,
      rooms: Object.values(payload),
    };
  }

  async update(id: string, updateRoomDto: UpdateRoomDTO) {
    const data = await this.datasource.transaction(async (manager) => {
      const existingRoom = await this.findOne(id);

      if (!existingRoom) {
        throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
      }

      for (const [key, value] of Object.entries(updateRoomDto)) {
        if (typeof value === 'string') {
          if (key === 'name') {
            const duplicate = await this.findByName(
              this.sanitizedName(updateRoomDto.name),
            );

            if (duplicate && duplicate.id !== id) {
              throw new ConflictException(sysMsg.DUPLICATE_ROOM_NAME);
            }
          }

          updateRoomDto[key] = this.sanitizedName(updateRoomDto['key']);
        }
      }

      let streamEntities: Stream[] = undefined;

      if (updateRoomDto.streams) {
        streamEntities = await this.validateStreams(updateRoomDto.streams);
      }

      Object.assign(existingRoom, updateRoomDto);

      if (streamEntities) {
        existingRoom.streams = streamEntities;
      }

      const updatedRoom = await manager.save(Room, existingRoom);

      return updatedRoom;
    });

    return { ...data, message: sysMsg.ROOM_UPDATED_SUCCESSFULLY };
  }

  async findOne(id: string) {
    const room = await this.roomModelAction.get({
      identifierOptions: { id },
      relations: { streams: true },
    });

    if (!room) {
      throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
    }

    return { ...room, message: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY };
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
