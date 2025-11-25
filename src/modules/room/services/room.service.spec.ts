import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource, In, Repository } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { Stream } from '../../stream/entities/stream.entity';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { RoomType } from '../enums/room-enum';
import { RoomModelAction } from '../model-actions/room-model-actions';

import { RoomService } from './room.service';

describe('RoomService', () => {
  let service: RoomService;

  let modelAction: {
    get: jest.Mock<
      Promise<unknown>,
      [{ identifierOptions: Record<string, unknown> }]
    >;
    create: jest.Mock<
      Promise<unknown>,
      [
        {
          createPayload: Record<string, unknown>;
          transactionOptions: { useTransaction: boolean };
        },
      ]
    >;
  };

  let streamRepo: {
    findBy: jest.Mock<
      Promise<Stream[]>,
      [Partial<Record<keyof Stream, unknown>>]
    >;
  };

  let dataSource: {
    getRepository: jest.Mock<Repository<Stream>>;
  };

  beforeEach(async () => {
    modelAction = {
      get: jest.fn(),
      create: jest.fn(),
    };

    streamRepo = {
      findBy: jest.fn(),
    };

    dataSource = {
      getRepository: jest
        .fn()
        .mockReturnValue(streamRepo as unknown as Repository<Stream>),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RoomService,
        { provide: RoomModelAction, useValue: modelAction },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = moduleRef.get(RoomService);
  });

  describe('create', () => {
    const dto: CreateRoomDTO = {
      name: '  Main Hall  ',
      type: RoomType.PHYSICAL,
      capacity: 120,
      location: 'West Block',
      building: 'B',
      floor: '2',
      description: 'Lecture hall',
      streams: [],
    };

    it('creates a room when name is free', async () => {
      modelAction.get.mockResolvedValue(null);
      modelAction.create.mockResolvedValue({ id: 'room-1', name: 'main hall' });

      const result = await service.create(dto);

      expect(modelAction.get).toHaveBeenCalledWith({
        identifierOptions: { name: 'main hall' },
      });

      expect(result.message).toBe(sysMsg.ROOM_CREATED_SUCCESSFULLY);
      expect(result.data).toEqual({ id: 'room-1', name: 'main hall' });
    });

    it('throws conflict when name already exists', async () => {
      modelAction.get.mockResolvedValue({ id: 'existing' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException if invalid stream IDs are supplied', async () => {
      const withStreams: CreateRoomDTO = { ...dto, streams: ['s1', 's2'] };

      modelAction.get.mockResolvedValue(null);
      streamRepo.findBy.mockResolvedValue([{ id: 's1' } as Stream]);

      await expect(service.create(withStreams)).rejects.toThrow(
        NotFoundException,
      );

      expect(streamRepo.findBy).toHaveBeenCalledWith({
        id: In(['s1', 's2']),
      });
    });

    it('creates a room with valid Stream relationships', async () => {
      const withStreams: CreateRoomDTO = { ...dto, streams: ['s1'] };

      modelAction.get.mockResolvedValue(null);
      streamRepo.findBy.mockResolvedValue([{ id: 's1' } as Stream]);

      modelAction.create.mockResolvedValue({
        id: 'room-10',
        name: 'main hall',
      });

      const result = await service.create(withStreams);

      expect(modelAction.create).toHaveBeenCalledWith({
        createPayload: expect.objectContaining({
          name: 'main hall',
          streams: [{ id: 's1' }],
        }),
        transactionOptions: { useTransaction: false },
      });

      expect(result.message).toBe(sysMsg.ROOM_CREATED_SUCCESSFULLY);
      expect(result.data).toEqual({ id: 'room-10', name: 'main hall' });
    });
  });
});
