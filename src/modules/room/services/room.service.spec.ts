import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { UpdateRoomDTO } from '../dto/update-room-dto';
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

  describe('update', () => {
    const mockManager = {
      save: jest.fn(),
    };

    const existingRoom: Room = {
      id: 'r1',
      name: 'room 1',
      type: 'Laboratory',
      capacity: 10,
      location: 'loc',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Room;

    const updateDto: UpdateRoomDTO = {
      name: ' Updated Room ',
    };

    const sanitizedName = 'updated room';

    beforeEach(() => {
      dataSource.transaction.mockImplementation(async (cb) => cb(mockManager));
      mockManager.save.mockClear();
    });

    it('updates a room successfully when name is unique', async () => {
      modelAction.get.mockResolvedValueOnce(existingRoom);
      modelAction.get.mockResolvedValueOnce(null);
      const savedEntity = { ...existingRoom, name: sanitizedName };
      mockManager.save.mockResolvedValue(savedEntity);

      const result = await service.update('r1', updateDto);

      expect(dataSource.transaction).toHaveBeenCalled();

      expect(modelAction.get).toHaveBeenNthCalledWith(1, {
        identifierOptions: { id: 'r1' },
        relations: { current_class: true },
      });

      expect(modelAction.get).toHaveBeenNthCalledWith(2, {
        identifierOptions: { name: sanitizedName },
      });

      expect(mockManager.save).toHaveBeenCalledWith(
        Room,
        expect.objectContaining({
          id: 'r1',
          name: sanitizedName,
        }),
      );

      expect(result).toEqual({
        message: sysMsg.ROOM_UPDATED_SUCCESSFULLY,
        ...savedEntity,
      });
    });

    it('throws NotFoundException if room does not exist', async () => {
      modelAction.get.mockResolvedValueOnce(null);

      await expect(service.update('r1', updateDto)).rejects.toThrow(
        NotFoundException,
      );

      expect(modelAction.get).toHaveBeenCalledTimes(1);
      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('throws ConflictException if updated name belongs to a different room', async () => {
      modelAction.get.mockResolvedValueOnce(existingRoom);

      const conflictRoom = { id: 'r2', name: sanitizedName } as Room;
      modelAction.get.mockResolvedValueOnce(conflictRoom);

      await expect(service.update('r1', updateDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockManager.save).not.toHaveBeenCalled();
    });

    it('allows update if the name exists but belongs to the SAME room', async () => {
      modelAction.get.mockResolvedValueOnce(existingRoom);

      const sameRoom = { id: 'r1', name: sanitizedName } as Room;
      modelAction.get.mockResolvedValueOnce(sameRoom);

      const savedEntity = { ...existingRoom, name: sanitizedName };
      mockManager.save.mockResolvedValue(savedEntity);

      await expect(service.update('r1', updateDto)).resolves.not.toThrow();

      expect(mockManager.save).toHaveBeenCalled();
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
});
