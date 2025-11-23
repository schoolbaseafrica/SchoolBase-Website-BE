import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { Class } from '../entities/class.entity';
import { Stream } from '../entities/stream.entity';

import { StreamService } from './stream.service';

type MockRepository<T = unknown> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('StreamService', () => {
  let service: StreamService;
  let streamRepository: MockRepository;
  let classRepository: MockRepository;

  const mockClassId = '123e4567-e89b-12d3-a456-426614174000';

  const mockStreamRepository = {
    find: jest.fn(),
  };

  const mockClassRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        {
          provide: getRepositoryToken(Stream),
          useValue: mockStreamRepository,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: mockClassRepository,
        },
      ],
    }).compile();

    service = module.get<StreamService>(StreamService);
    streamRepository = module.get(getRepositoryToken(Stream));
    classRepository = module.get(getRepositoryToken(Class));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreamsByClass', () => {
    it('should return a list of streams with student counts when class exists', async () => {
      // Arrange
      const mockClass = { id: mockClassId, name: 'JSS 1' };
      const mockStreams = [
        {
          id: 'stream-1',
          name: 'Gold',
          class: mockClass,
          students: [{ id: 'student-1' }, { id: 'student-2' }], // 2 students
        },
        {
          id: 'stream-2',
          name: 'Silver',
          class: mockClass,
          students: [], // 0 students
        },
      ];

      classRepository.findOne.mockResolvedValue(mockClass);
      streamRepository.find.mockResolvedValue(mockStreams);

      // Act
      const result = await service.getStreamsByClass(mockClassId);

      // Assert
      expect(classRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockClassId },
      });
      expect(streamRepository.find).toHaveBeenCalledWith({
        where: { class: { id: mockClassId } },
        relations: ['students'],
        order: { name: 'ASC' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].studentCount).toBe(2); // Validates the counting logic
      expect(result[1].studentCount).toBe(0);
    });

    it('should throw NotFoundException if class does not exist', async () => {
      // Arrange
      classRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStreamsByClass(mockClassId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getStreamsByClass(mockClassId)).rejects.toThrow(
        sysMsg.CLASS_NOT_FOUND,
      );
    });
  });
});
