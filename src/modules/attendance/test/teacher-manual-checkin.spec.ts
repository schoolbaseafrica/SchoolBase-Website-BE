import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { IRequestWithUser } from '../../../common/types/request-with-user.interface';
import * as sysMsg from '../../../constants/system.messages';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import { CreateTeacherManualCheckinDto } from '../dto';
import { TeacherManualCheckinStatusEnum } from '../enums/teacher-manual-checkin.enum';
import { TeacherManualCheckinModelAction } from '../model-actions';
import { TeacherManualCheckinService } from '../services/teacher-manual-checkin-service';

describe('TeacherManualCheckinService', () => {
  let service: TeacherManualCheckinService;
  let module: TestingModule;
  let teacherManualCheckinModelAction: jest.Mocked<TeacherManualCheckinModelAction>;
  let teacherModelAction: jest.Mocked<TeacherModelAction>;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockBaseLogger = {
    child: jest.fn().mockReturnValue(mockLogger),
  };

  const mockUser = {
    user: {
      userId: 'user-123',
      email: 'teacher@example.com',
    },
  } as unknown as IRequestWithUser;

  const mockTeacher = {
    id: 'teacher-123',
    user_id: 'user-123',
    is_active: true,
  };

  const validDto: CreateTeacherManualCheckinDto = {
    date: '2025-12-01',
    check_in_time: '08:30:00',
    reason: 'Late due to traffic',
  };

  beforeEach(async () => {
    const mockTeacherManualCheckinModelAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockTeacherModelAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        TeacherManualCheckinService,
        {
          provide: TeacherManualCheckinModelAction,
          useValue: mockTeacherManualCheckinModelAction,
        },
        {
          provide: TeacherModelAction,
          useValue: mockTeacherModelAction,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockBaseLogger,
        },
      ],
    }).compile();

    service = module.get<TeacherManualCheckinService>(
      TeacherManualCheckinService,
    );
    teacherManualCheckinModelAction = module.get(
      TeacherManualCheckinModelAction,
    );
    teacherModelAction = module.get(TeacherModelAction);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a teacher manual checkin', async () => {
      const mockCreatedCheckin = {
        id: 'checkin-123',
        teacher_id: mockTeacher.id,
        check_in_date: new Date(validDto.date),
        check_in_time: new Date(`${validDto.date}T${validDto.check_in_time}`),
        reason: validDto.reason,
        submitted_at: new Date(),
        status: TeacherManualCheckinStatusEnum.PENDING,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherManualCheckinModelAction.get.mockResolvedValue(null);
      teacherManualCheckinModelAction.create.mockResolvedValue(
        mockCreatedCheckin as never,
      );

      const result = await service.create(mockUser, validDto);

      expect(result.message).toBe(
        sysMsg.TEACHER_MANUAL_CHECKIN_CREATED_SUCCESSFULLY,
      );
      expect(result.data).toBeDefined();
      expect(teacherModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { user_id: mockUser.user.userId },
      });
      expect(teacherManualCheckinModelAction.create).toHaveBeenCalledWith({
        createPayload: expect.objectContaining({
          teacher_id: mockTeacher.id,
          reason: validDto.reason,
          status: TeacherManualCheckinStatusEnum.PENDING,
        }),
        transactionOptions: { useTransaction: false },
      });
    });

    it('should throw NotFoundException when teacher is not found', async () => {
      teacherModelAction.get.mockResolvedValue(null);

      await expect(service.create(mockUser, validDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(mockUser, validDto)).rejects.toThrow(
        sysMsg.TEACHER_NOT_FOUND,
      );
    });

    it('should throw BadRequestException when teacher is not active', async () => {
      const inactiveTeacher = { ...mockTeacher, is_active: false };
      teacherModelAction.get.mockResolvedValue(inactiveTeacher as never);

      await expect(service.create(mockUser, validDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUser, validDto)).rejects.toThrow(
        sysMsg.TEACHER_IS_NOT_ACTIVE,
      );
    });

    it('should throw BadRequestException when check-in date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const futureDateDto: CreateTeacherManualCheckinDto = {
        ...validDto,
        date: futureDateStr,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);

      await expect(service.create(mockUser, futureDateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUser, futureDateDto)).rejects.toThrow(
        sysMsg.CHECK_IN_DATE_IS_IN_THE_FUTURE,
      );
    });

    it('should throw BadRequestException when check-in time is before school hours (before 7 AM)', async () => {
      const earlyDto: CreateTeacherManualCheckinDto = {
        ...validDto,
        check_in_time: '06:30:00',
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);

      await expect(service.create(mockUser, earlyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUser, earlyDto)).rejects.toThrow(
        sysMsg.CHECK_IN_TIME_NOT_WITHIN_SCHOOL_HOURS,
      );
    });

    it('should throw BadRequestException when check-in time is after school hours (at or after 5 PM)', async () => {
      const lateDto: CreateTeacherManualCheckinDto = {
        ...validDto,
        check_in_time: '17:00:00',
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);

      await expect(service.create(mockUser, lateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUser, lateDto)).rejects.toThrow(
        sysMsg.CHECK_IN_TIME_NOT_WITHIN_SCHOOL_HOURS,
      );
    });

    it('should throw BadRequestException when already checked in for the same date', async () => {
      const existingCheckin = {
        id: 'existing-checkin-123',
        teacher_id: mockTeacher.id,
        check_in_date: new Date(validDto.date),
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherManualCheckinModelAction.get.mockResolvedValue(
        existingCheckin as never,
      );

      await expect(service.create(mockUser, validDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(mockUser, validDto)).rejects.toThrow(
        sysMsg.ALREADY_CHECKED_IN_FOR_THE_SAME_DATE,
      );
    });

    it('should accept check-in time at 7 AM', async () => {
      const boundaryDto: CreateTeacherManualCheckinDto = {
        ...validDto,
        check_in_time: '07:00:00',
      };

      const mockCreatedCheckin = {
        id: 'checkin-123',
        teacher_id: mockTeacher.id,
        check_in_date: new Date(boundaryDto.date),
        check_in_time: new Date(
          `${boundaryDto.date}T${boundaryDto.check_in_time}`,
        ),
        reason: boundaryDto.reason,
        submitted_at: new Date(),
        status: TeacherManualCheckinStatusEnum.PENDING,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherManualCheckinModelAction.get.mockResolvedValue(null);
      teacherManualCheckinModelAction.create.mockResolvedValue(
        mockCreatedCheckin as never,
      );

      const result = await service.create(mockUser, boundaryDto);

      expect(result.message).toBe(
        sysMsg.TEACHER_MANUAL_CHECKIN_CREATED_SUCCESSFULLY,
      );
    });

    it('should accept check-in time at 4:59 PM', async () => {
      const boundaryDto: CreateTeacherManualCheckinDto = {
        ...validDto,
        check_in_time: '16:59:00',
      };

      const mockCreatedCheckin = {
        id: 'checkin-123',
        teacher_id: mockTeacher.id,
        check_in_date: new Date(boundaryDto.date),
        check_in_time: new Date(
          `${boundaryDto.date}T${boundaryDto.check_in_time}`,
        ),
        reason: boundaryDto.reason,
        submitted_at: new Date(),
        status: TeacherManualCheckinStatusEnum.PENDING,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherManualCheckinModelAction.get.mockResolvedValue(null);
      teacherManualCheckinModelAction.create.mockResolvedValue(
        mockCreatedCheckin as never,
      );

      const result = await service.create(mockUser, boundaryDto);

      expect(result.message).toBe(
        sysMsg.TEACHER_MANUAL_CHECKIN_CREATED_SUCCESSFULLY,
      );
    });
  });
});
