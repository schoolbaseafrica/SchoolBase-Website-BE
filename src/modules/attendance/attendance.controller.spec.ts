import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';

import { AcademicSessionModelAction } from '../academic-session/model-actions/academic-session-actions';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceModelAction } from './model-actions';

describe('AttendanceController', () => {
  let controller: AttendanceController;

  beforeEach(async () => {
    const mockAttendanceModelAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockAcademicSessionModelAction = {
      list: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        AttendanceService,
        {
          provide: AttendanceModelAction,
          useValue: mockAttendanceModelAction,
        },
        {
          provide: AcademicSessionModelAction,
          useValue: mockAcademicSessionModelAction,
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            child: jest.fn().mockReturnValue({
              info: jest.fn(),
              warn: jest.fn(),
              error: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
