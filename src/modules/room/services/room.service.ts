import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, FindOptionsOrder, FindOptionsWhere } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { FilterRoomDTO } from '../dto/filter-room-dto';
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
    return this.datasource.transaction(async (manager) => {
      const existingRoom = await this.findByName(
        this.sanitizedField(createRoomDto.name),
      );

      if (existingRoom) {
        throw new ConflictException(sysMsg.DUPLICATE_ROOM_NAME);
      }

      const newRoom = await this.roomModelAction.create({
        createPayload: {
          name: this.sanitizedField(createRoomDto.name),
          type: this.sanitizedField(createRoomDto.type),
          capacity: createRoomDto.capacity,
          location: this.sanitizedField(createRoomDto.location),
        },
        transactionOptions: {
          useTransaction: true,
          transaction: manager,
        },
      });

      return { ...newRoom, message: sysMsg.ROOM_CREATED_SUCCESSFULLY };
    });
  }

  async findAll(filters: FilterRoomDTO) {
    const filterOptions: FindOptionsWhere<Room> = {};

    if (filters.type) {
      filterOptions.type = filters.type;
    }

    const order: FindOptionsOrder<Room> = {};

    if (filters.sortBy) {
      order[filters.sortBy] = filters.sortOrder;
    } else {
      order.name = 'ASC';
    }

    const { payload, paginationMeta } = await this.roomModelAction.list({
      relations: { schedules: true },
      filterRecordOptions: { ...filterOptions },
      paginationPayload: {
        page: filters.page,
        limit: filters.limit,
      },
      order,
    });

    return {
      message: sysMsg.ROOM_LIST_RETRIEVED_SUCCESSFULLY,
      rooms: payload,
      meta: { ...filters, ...paginationMeta },
    };
  }

  async update(id: string, updateRoomDto: UpdateRoomDTO) {
    return this.datasource.transaction(async (manager) => {
      const roomEntity = await manager.findOne(Room, { where: { id } });
      if (!roomEntity) {
        throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
      }

      for (const [key, value] of Object.entries(updateRoomDto)) {
        if (typeof value === 'string') {
          const sanitizedVal = this.sanitizedField(value);
          updateRoomDto[key] = sanitizedVal;

          if (key === 'name') {
            const duplicate = await this.findByName(sanitizedVal);
            if (duplicate && duplicate.id !== id) {
              throw new ConflictException(sysMsg.DUPLICATE_ROOM_NAME);
            }
          }
        }
      }

      Object.assign(roomEntity, updateRoomDto);
      const updatedRoom = await manager.save(Room, roomEntity);

      return { ...updatedRoom, message: sysMsg.ROOM_UPDATED_SUCCESSFULLY };
    });
  }

  async findOne(id: string) {
    const room = await this.roomModelAction.get({
      identifierOptions: { id },
      relations: { schedules: true },
    });

    if (!room) {
      throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
    }

    return { ...room, message: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY };
  }

  async remove(id: string) {
    return this.datasource.transaction(async (manager) => {
      const room = await manager.findOne(Room, {
        where: { id },
        relations: ['schedules'],
      });

      if (!room) {
        throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
      }

      if (room.schedules && room.schedules.length > 0) {
        throw new ConflictException(sysMsg.CANNOT_DELETE_OCCUPIED_ROOM);
      }

      await this.roomModelAction.delete({
        identifierOptions: { id },
        transactionOptions: { useTransaction: true, transaction: manager },
      });

      return {
        message: sysMsg.ROOM_DELETED_SUCCESSFULLY,
      };
    });
  }

  private async findByName(name: string) {
    const room = await this.roomModelAction.get({
      identifierOptions: { name },
    });
    return room;
  }

  private sanitizedField(value: string) {
    return value.trim().toLowerCase();
  }
}
