import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { ClassModelAction } from '../../class/model-actions/class.actions';
import { StreamModelAction } from '../model-actions/stream.model-action';

import { StreamService } from './stream.service';

interface IMockStreamModelAction {
  list: jest.Mock;
}

interface IMockClassModelAction {
  get: jest.Mock;
}

describe('StreamService', () => {
  let service: StreamService;
  let streamModelAction: IMockStreamModelAction;
  let classModelAction: IMockClassModelAction;

  const mockClassId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const mockStreamActionObj = {
      list: jest.fn(),
    };

    const mockClassActionObj = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamService,
        {
          provide: StreamModelAction,
          useValue: mockStreamActionObj,
        },
        {
          provide: ClassModelAction,
          useValue: mockClassActionObj,
        },
      ],
    }).compile();

    service = module.get<StreamService>(StreamService);
    streamModelAction = module.get(StreamModelAction);
    classModelAction = module.get(ClassModelAction);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreamsByClass', () => {
    it('should return streams with student counts when class exists', async () => {
      const mockStreams = [
        {
          id: 'stream-1',
          name: 'Gold',
          class_id: mockClassId,
          students: [{ id: 'student-1' }, { id: 'student-2' }], // 2 students
        },
        {
          id: 'stream-2',
          name: 'Silver',
          class_id: mockClassId,
          students: [], // 0 students
        },
      ];

      classModelAction.get.mockResolvedValue({ id: mockClassId });

      streamModelAction.list.mockResolvedValue({
        payload: mockStreams,
        paginationMeta: {},
      });

      // Act
      const result = await service.getStreamsByClass(mockClassId);

      // Assert
      expect(classModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockClassId },
      });
      expect(streamModelAction.list).toHaveBeenCalledWith(
        expect.objectContaining({
          filterRecordOptions: { class_id: mockClassId },
          relations: { students: true },
        }),
      );

      expect(result).toHaveLength(2);
      expect(result[0].student_count).toBe(2); // Validates counting logic
      expect(result[1].student_count).toBe(0);
    });

    it('should throw NotFoundException if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);

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
