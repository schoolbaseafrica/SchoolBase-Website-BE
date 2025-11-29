import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  FindOptionsOrder,
  FindOptionsWhere,
  IsNull,
  Not,
} from 'typeorm';

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
    const data = await this.datasource.transaction(async (manager) => {
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

    return data;
  }

  async findAll(filters: FilterRoomDTO) {
    const filterOptions: FindOptionsWhere<Room> = {};

    if (filters.type) {
      filterOptions.type = filters.type;
    }

    if (filters.isOccupied !== undefined) {
      filterOptions.current_class = filters.isOccupied
        ? Not(IsNull())
        : IsNull();
    }

    const order: FindOptionsOrder<Room> = {};

    if (filters.sortBy) {
      order[filters.sortBy] = filters.sortOrder;
    } else {
      order.name = 'ASC';
    }

    const { payload, paginationMeta } = await this.roomModelAction.list({
      relations: { current_class: true },
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
    const data = await this.datasource.transaction(async (manager) => {
      const existingRoom = await this.findOne(id);

      if (!existingRoom) {
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

      Object.assign(existingRoom, updateRoomDto);

      const updatedRoom = await manager.save(Room, existingRoom);

      return updatedRoom;
    });

    return { ...data, message: sysMsg.ROOM_UPDATED_SUCCESSFULLY };
  }

  async findOne(id: string) {
    const room = await this.roomModelAction.get({
      identifierOptions: { id },
      relations: { current_class: true },
    });

    if (!room) {
      throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
    }

    return { ...room, message: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY };
  }

  async remove(id: string) {
    const data = await this.datasource.transaction(async (manager) => {
      const room = await this.findOne(id);

      if (!room) {
        throw new NotFoundException(sysMsg.ROOM_NOT_FOUND);
      }

      if (room.current_class) {
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

    return data;
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
