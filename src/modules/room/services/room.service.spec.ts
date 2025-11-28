import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { Room } from '../entities/room.entity';
import { RoomModelAction } from '../model-actions/room-model-actions';

import { RoomService } from './room.service';

describe('RoomService', () => {
  let service: RoomService;

  let modelAction: {
    get: jest.Mock;
    create: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };

  let streamRepo: {
    findBy: jest.Mock;
  };

  let roomRepo: {
    save: jest.Mock;
  };

  let dataSource: {
    getRepository: jest.Mock;
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    modelAction = {
      get: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    streamRepo = {
      findBy: jest.fn(),
    };

    roomRepo = {
      save: jest.fn(),
    };

    dataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Stream) return streamRepo;
        if (entity === Room) return roomRepo;
        return null;
      }),
      transaction: jest.fn().mockImplementation(async (cb) => {
        return cb('MOCK_MANAGER');
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: RoomModelAction, useValue: modelAction },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get<RoomService>(RoomService);
  });

  describe('create', () => {
    const dto: CreateRoomDTO = {
      name: '  Main Hall  ',
      type: 'Laboratory',
      capacity: 120,
      location: 'West Block',
    };

    it('creates a room when name is free', async () => {
      modelAction.get.mockResolvedValue(null);

      const createdEntity = { id: 'room-1', name: 'main hall' };
      modelAction.create.mockResolvedValue(createdEntity);

      const result = await service.create(dto);

      expect(dataSource.transaction).toHaveBeenCalled();

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { name: 'main hall' },
      });

      expect(modelAction.create).toHaveBeenCalledWith({
        createPayload: expect.objectContaining({
          name: 'main hall',
        }),
        transactionOptions: {
          useTransaction: true,
          transaction: 'MOCK_MANAGER',
        },
      });

      expect(result).toEqual({
        message: sysMsg.ROOM_CREATED_SUCCESSFULLY,
        ...createdEntity,
      });
    });

    it('throws conflict when name already exists', async () => {
      modelAction.get.mockResolvedValue({ id: 'existing' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns a list of rooms', async () => {
      const rooms: Room[] = [{ id: 'r1', name: 'Room 1' } as Room];
      modelAction.list.mockResolvedValue({ payload: rooms });

      const result = await service.findAll();

      expect(modelAction.list).toHaveBeenCalledWith({
        relations: { current_class: true },
      });
      expect(result).toEqual({
        message: sysMsg.ROOM_LIST_RETRIEVED_SUCCESSFULLY,
        rooms,
      });
    });
  });

  describe('findOne', () => {
    it('returns a room when found', async () => {
      const room: Room = { id: 'r1', name: 'Room 1' } as Room;
      modelAction.get.mockResolvedValue(room);

      const result = await service.findOne('r1');

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'r1' },
        relations: { current_class: true },
      });
      expect(result).toEqual({
        message: sysMsg.ROOM_RETRIEVED_SUCCESSFULLY,
        ...room,
      });
    });

    it('throws NotFoundException if room does not exist', async () => {
      modelAction.get.mockResolvedValue(null);
      await expect(service.findOne('r1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a room successfully when it is empty', async () => {
      const emptyRoom = { id: 'r1', current_class: null } as Room;

      modelAction.get.mockResolvedValue(emptyRoom);
      modelAction.delete.mockResolvedValue({ raw: [], affected: 1 });

      const result = await service.remove('r1');

      expect(dataSource.transaction).toHaveBeenCalled();

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'r1' },
        relations: { current_class: true },
      });

      expect(modelAction.delete).toHaveBeenCalledWith({
        identifierOptions: { id: 'r1' },
        transactionOptions: {
          useTransaction: true,
          transaction: 'MOCK_MANAGER',
        },
      });

      expect(result).toEqual({
        message: sysMsg.ROOM_DELETED_SUCCESSFULLY,
      });
    });

    it('throws NotFoundException if room does not exist', async () => {
      modelAction.get.mockResolvedValue(null);

      await expect(service.remove('r1')).rejects.toThrow(NotFoundException);

      expect(modelAction.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException if room is currently occupied by a class', async () => {
      const occupiedRoom = {
        id: 'r1',
        current_class: { id: 'c1', title: 'Math' },
      } as unknown as Room;

      modelAction.get.mockResolvedValue(occupiedRoom);

      await expect(service.remove('r1')).rejects.toThrow(ConflictException);

      expect(modelAction.delete).not.toHaveBeenCalled();
    });
  });
});
