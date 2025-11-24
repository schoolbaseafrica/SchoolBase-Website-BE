import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { StreamResponseDto } from '../dto/stream-response.dto';
import { StreamService } from '../services/stream.service';

import { StreamController } from './stream.controller';

// Define interface for mock service
interface IMockStreamService {
  getStreamsByClass: jest.Mock;
}

describe('StreamController', () => {
  let controller: StreamController;
  let service: IMockStreamService;

  const mockClassId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const mockServiceObj = {
      getStreamsByClass: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamController],
      providers: [
        {
          provide: StreamService,
          useValue: mockServiceObj,
        },
      ],
    }).compile();

    controller = module.get<StreamController>(StreamController);
    service = module.get(StreamService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStreamsByClass', () => {
    it('should return formatted response with streams', async () => {
      // Arrange
      const mockStreams: StreamResponseDto[] = [
        { id: '1', name: 'Gold', student_count: 10 },
      ];
      service.getStreamsByClass.mockResolvedValue(mockStreams);

      // Act
      const result = await controller.getStreamsByClass(mockClassId);

      // Assert
      expect(service.getStreamsByClass).toHaveBeenCalledWith(mockClassId);
      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: sysMsg.STREAMS_RETRIEVED,
        data: mockStreams,
      });
    });
  });
});
