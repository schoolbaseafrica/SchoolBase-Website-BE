import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';

import { AcademicSessionModelAction } from '../academic-session/model-actions/academic-session-actions';

import { ScheduleBasedAttendanceController } from './controllers/schedule-based-attendance.controller';
import { AttendanceModelAction } from './model-actions';
import { AttendanceService } from './services/attendance.service';

describe('ScheduleBasedAttendanceController', () => {
  let controller: ScheduleBasedAttendanceController;

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
      controllers: [ScheduleBasedAttendanceController],
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

    controller = module.get<ScheduleBasedAttendanceController>(
      ScheduleBasedAttendanceController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
