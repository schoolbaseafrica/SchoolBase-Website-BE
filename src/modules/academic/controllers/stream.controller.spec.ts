import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { StreamResponseDto } from '../dto/stream-response.dto';
import { StreamService } from '../services/stream.service';

import { StreamController } from './stream.controller';

describe('StreamController', () => {
  let controller: StreamController;
  let service: StreamService;

  const mockStreamService = {
    getStreamsByClass: jest.fn(),
  };

  const mockClassId = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamController],
      providers: [
        {
          provide: StreamService,
          useValue: mockStreamService,
        },
      ],
    }).compile();

    controller = module.get<StreamController>(StreamController);
    service = module.get<StreamService>(StreamService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStreamsByClass', () => {
    it('should return streams wrapped in IBaseResponse structure', async () => {
      const mockStreams: StreamResponseDto[] = [
        { id: '1', name: 'A', studentCount: 10 },
      ];
      mockStreamService.getStreamsByClass.mockResolvedValue(mockStreams);

      const result = await controller.getStreamsByClass(mockClassId);

      expect(service.getStreamsByClass).toHaveBeenCalledWith(mockClassId);
      expect(result).toEqual({
        status_code: HttpStatus.OK,
        message: sysMsg.STREAMS_RETRIEVED,
        data: mockStreams,
      });
    });

    it('should propagate errors from the service', async () => {
      mockStreamService.getStreamsByClass.mockRejectedValue(
        new NotFoundException(sysMsg.CLASS_NOT_FOUND),
      );

      await expect(controller.getStreamsByClass(mockClassId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
