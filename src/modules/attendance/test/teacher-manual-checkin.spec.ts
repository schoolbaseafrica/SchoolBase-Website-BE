import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';

import { IRequestWithUser } from '../../../common/types/request-with-user.interface';
import * as sysMsg from '../../../constants/system.messages';
import { TeacherModelAction } from '../../teacher/model-actions/teacher-actions';
import {
  CreateTeacherManualCheckinDto,
  CreateTeacherCheckoutDto,
  ListTeacherCheckinRequestsQueryDto,
  ReviewTeacherManualCheckinDto,
} from '../dto';
import { TeacherDailyAttendanceDecisionEnum } from '../enums';
import { TeacherManualCheckinStatusEnum } from '../enums/teacher-manual-checkin.enum';
import { TeacherManualCheckinModelAction } from '../model-actions';
import { TeacherDailyAttendanceModelAction } from '../model-actions/teacher-daily-attendance.action';
import { TeacherManualCheckinService } from '../services/teacher-manual-checkin-service';

describe('TeacherManualCheckinService', () => {
  let service: TeacherManualCheckinService;
  let module: TestingModule;
  let teacherManualCheckinModelAction: jest.Mocked<TeacherManualCheckinModelAction>;
  let teacherModelAction: jest.Mocked<TeacherModelAction>;
  let teacherDailyAttendanceModelAction: jest.Mocked<TeacherDailyAttendanceModelAction>;

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

  const mockAdmin = {
    user: {
      userId: 'admin-123',
      email: 'admin@example.com',
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

    const mockTeacherDailyAttendanceModelAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((callback) => callback({})),
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
          provide: TeacherDailyAttendanceModelAction,
          useValue: mockTeacherDailyAttendanceModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
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
    teacherDailyAttendanceModelAction = module.get(
      TeacherDailyAttendanceModelAction,
    );
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

  describe('listTeacherCheckinRequests', () => {
    const mockCheckinRequests = [
      {
        id: 'checkin-1',
        teacher_id: 'teacher-123',
        check_in_date: new Date('2025-12-01'),
        check_in_time: new Date('2025-12-01T08:30:00'),
        reason: 'Traffic',
        status: TeacherManualCheckinStatusEnum.PENDING,
        submitted_at: new Date(),
      },
      {
        id: 'checkin-2',
        teacher_id: 'teacher-456',
        check_in_date: new Date('2025-12-01'),
        check_in_time: new Date('2025-12-01T09:00:00'),
        reason: 'Car trouble',
        status: TeacherManualCheckinStatusEnum.PENDING,
        submitted_at: new Date(),
      },
    ];

    it('should return list of checkin requests with pagination', async () => {
      const query: ListTeacherCheckinRequestsQueryDto = {
        page: 1,
        limit: 10,
      };

      teacherManualCheckinModelAction.list.mockResolvedValue({
        payload: mockCheckinRequests,
        paginationMeta: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      } as never);

      const result = await service.listTeacherCheckinRequests(query);

      expect(result.message).toBe(
        sysMsg.PENDING_CHECKIN_REQUESTS_FETCHED_SUCCESSFULLY,
      );
      expect(result.data).toHaveLength(2);
      expect(result.meta).toBeDefined();
      expect(teacherManualCheckinModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: {},
        paginationPayload: { page: 1, limit: 10 },
      });
    });

    it('should filter by status when provided', async () => {
      const query: ListTeacherCheckinRequestsQueryDto = {
        page: 1,
        limit: 10,
        status: TeacherManualCheckinStatusEnum.PENDING,
      };

      teacherManualCheckinModelAction.list.mockResolvedValue({
        payload: mockCheckinRequests,
        paginationMeta: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      } as never);

      await service.listTeacherCheckinRequests(query);

      expect(teacherManualCheckinModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { status: TeacherManualCheckinStatusEnum.PENDING },
        paginationPayload: { page: 1, limit: 10 },
      });
    });

    it('should filter by check_in_date when provided', async () => {
      const query: ListTeacherCheckinRequestsQueryDto = {
        page: 1,
        limit: 10,
        check_in_date: '2025-12-01',
      };

      teacherManualCheckinModelAction.list.mockResolvedValue({
        payload: mockCheckinRequests,
        paginationMeta: {
          totalItems: 2,
          totalPages: 1,
          currentPage: 1,
          itemsPerPage: 10,
        },
      } as never);

      await service.listTeacherCheckinRequests(query);

      expect(teacherManualCheckinModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { check_in_date: new Date('2025-12-01') },
        paginationPayload: { page: 1, limit: 10 },
      });
    });

    it('should return empty array when no requests found', async () => {
      const query: ListTeacherCheckinRequestsQueryDto = {
        page: 1,
        limit: 10,
      };

      teacherManualCheckinModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: 10,
        },
      } as never);

      const result = await service.listTeacherCheckinRequests(query);

      expect(result.data).toHaveLength(0);
    });
  });

  describe('reviewTeacherCheckinRequest', () => {
    const mockPendingCheckinRequest = {
      id: 'checkin-123',
      teacher_id: 'teacher-123',
      check_in_date: new Date('2025-12-01'),
      check_in_time: new Date('2025-12-01T08:30:00'),
      reason: 'Traffic',
      status: TeacherManualCheckinStatusEnum.PENDING,
      submitted_at: new Date(),
    };

    it('should approve a pending checkin request and create attendance record', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
        review_notes: 'Approved',
      };

      const mockUpdatedRequest = {
        ...mockPendingCheckinRequest,
        status: TeacherManualCheckinStatusEnum.APPROVED,
        reviewed_by: mockAdmin.user.userId,
        reviewed_at: new Date(),
        review_notes: dto.review_notes,
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        mockPendingCheckinRequest as never,
      );
      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(null);
      teacherDailyAttendanceModelAction.create.mockResolvedValue({} as never);
      teacherManualCheckinModelAction.update.mockResolvedValue(
        mockUpdatedRequest as never,
      );

      const result = await service.reviewTeacherCheckinRequest(
        mockAdmin,
        'checkin-123',
        dto,
      );

      expect(result.message).toBe(sysMsg.CHECKIN_REQUEST_APPROVED);
      expect(teacherDailyAttendanceModelAction.create).toHaveBeenCalled();
      expect(teacherManualCheckinModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: 'checkin-123' },
          updatePayload: expect.objectContaining({
            status: TeacherManualCheckinStatusEnum.APPROVED,
            reviewed_by: mockAdmin.user.userId,
            review_notes: dto.review_notes,
          }),
        }),
      );
    });

    it('should reject a pending checkin request without creating attendance', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.REJECTED,
        review_notes: 'Insufficient evidence',
      };

      const mockUpdatedRequest = {
        ...mockPendingCheckinRequest,
        status: TeacherManualCheckinStatusEnum.REJECTED,
        reviewed_by: mockAdmin.user.userId,
        reviewed_at: new Date(),
        review_notes: dto.review_notes,
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        mockPendingCheckinRequest as never,
      );
      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherManualCheckinModelAction.update.mockResolvedValue(
        mockUpdatedRequest as never,
      );

      const result = await service.reviewTeacherCheckinRequest(
        mockAdmin,
        'checkin-123',
        dto,
      );

      expect(result.message).toBe(sysMsg.CHECKIN_REQUEST_REJECTED);
      expect(teacherDailyAttendanceModelAction.create).not.toHaveBeenCalled();
      expect(teacherManualCheckinModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            status: TeacherManualCheckinStatusEnum.REJECTED,
          }),
        }),
      );
    });

    it('should throw NotFoundException when checkin request not found', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(null);

      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'non-existent', dto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'non-existent', dto),
      ).rejects.toThrow(sysMsg.CHECKIN_REQUEST_NOT_FOUND);
    });

    it('should throw BadRequestException when request already processed', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
      };

      const alreadyApprovedRequest = {
        ...mockPendingCheckinRequest,
        status: TeacherManualCheckinStatusEnum.APPROVED,
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        alreadyApprovedRequest as never,
      );

      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto),
      ).rejects.toThrow(sysMsg.CHECKIN_REQUEST_ALREADY_PROCESSED);
    });

    it('should throw NotFoundException when teacher not found during review', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        mockPendingCheckinRequest as never,
      );
      teacherModelAction.get.mockResolvedValue(null);

      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto),
      ).rejects.toThrow(sysMsg.TEACHER_NOT_FOUND);
    });

    it('should throw ConflictException when attendance already exists for the date', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
      };

      const existingAttendance = {
        id: 'attendance-123',
        teacher_id: 'teacher-123',
        date: new Date('2025-12-01'),
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        mockPendingCheckinRequest as never,
      );
      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(
        existingAttendance as never,
      );

      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto),
      ).rejects.toThrow(sysMsg.ATTENDANCE_ALREADY_MARKED_FOR_DATE);
    });

    it('should mark attendance as LATE when check-in time is at or after 9 AM', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
      };

      const lateCheckinRequest = {
        ...mockPendingCheckinRequest,
        check_in_time: new Date('2025-12-01T09:30:00'),
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        lateCheckinRequest as never,
      );
      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(null);
      teacherDailyAttendanceModelAction.create.mockResolvedValue({} as never);
      teacherManualCheckinModelAction.update.mockResolvedValue({
        ...lateCheckinRequest,
        status: TeacherManualCheckinStatusEnum.APPROVED,
      } as never);

      await service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto);

      expect(teacherDailyAttendanceModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            status: 'LATE',
          }),
        }),
      );
    });

    it('should mark attendance as PRESENT when check-in time is before 9 AM', async () => {
      const dto: ReviewTeacherManualCheckinDto = {
        decision: TeacherDailyAttendanceDecisionEnum.APPROVED,
      };

      teacherManualCheckinModelAction.get.mockResolvedValue(
        mockPendingCheckinRequest as never,
      );
      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(null);
      teacherDailyAttendanceModelAction.create.mockResolvedValue({} as never);
      teacherManualCheckinModelAction.update.mockResolvedValue({
        ...mockPendingCheckinRequest,
        status: TeacherManualCheckinStatusEnum.APPROVED,
      } as never);

      await service.reviewTeacherCheckinRequest(mockAdmin, 'checkin-123', dto);

      expect(teacherDailyAttendanceModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            status: 'PRESENT',
          }),
        }),
      );
    });
  });

  describe('teacherCheckout', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const mockAttendanceRecord = {
      id: 'attendance-123',
      teacher_id: 'teacher-123',
      date: today,
      check_in_time: new Date(`${today.toISOString().split('T')[0]}T08:00:00`),
      check_out_time: null,
      status: 'PRESENT',
      notes: null,
    };

    const checkoutDto: CreateTeacherCheckoutDto = {
      notes: 'Leaving for appointment',
    };

    it('should successfully checkout a teacher', async () => {
      const updatedAttendance = {
        ...mockAttendanceRecord,
        check_out_time: new Date(),
        total_hours: 8.5,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(
        mockAttendanceRecord as never,
      );
      teacherDailyAttendanceModelAction.update.mockResolvedValue(
        updatedAttendance as never,
      );

      const result = await service.teacherCheckout(mockUser, checkoutDto);

      expect(result.message).toBe(sysMsg.TEACHER_CHECKOUT_SUCCESS);
      expect(result.data).toBeDefined();
      expect(teacherDailyAttendanceModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: { id: mockAttendanceRecord.id },
          updatePayload: expect.objectContaining({
            check_out_time: expect.any(Date),
            total_hours: expect.any(Number),
          }),
        }),
      );
    });

    it('should checkout without notes', async () => {
      const dtoWithoutNotes: CreateTeacherCheckoutDto = {};

      const updatedAttendance = {
        ...mockAttendanceRecord,
        check_out_time: new Date(),
        total_hours: 8.5,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(
        mockAttendanceRecord as never,
      );
      teacherDailyAttendanceModelAction.update.mockResolvedValue(
        updatedAttendance as never,
      );

      const result = await service.teacherCheckout(mockUser, dtoWithoutNotes);

      expect(result.message).toBe(sysMsg.TEACHER_CHECKOUT_SUCCESS);
    });

    it('should throw NotFoundException when teacher not found', async () => {
      teacherModelAction.get.mockResolvedValue(null);

      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(sysMsg.TEACHER_NOT_FOUND);
    });

    it('should throw BadRequestException when teacher is not active', async () => {
      const inactiveTeacher = { ...mockTeacher, is_active: false };
      teacherModelAction.get.mockResolvedValue(inactiveTeacher as never);

      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(sysMsg.TEACHER_IS_NOT_ACTIVE);
    });

    it('should throw BadRequestException when no checkin for today', async () => {
      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(null);
      teacherManualCheckinModelAction.get.mockResolvedValue(null);

      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(sysMsg.NO_CHECKIN_FOR_TODAY);
    });

    it('should throw BadRequestException when checkin is pending approval', async () => {
      const pendingRequest = {
        id: 'pending-123',
        teacher_id: 'teacher-123',
        check_in_date: today,
        status: TeacherManualCheckinStatusEnum.PENDING,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(null);
      teacherManualCheckinModelAction.get.mockResolvedValue(
        pendingRequest as never,
      );

      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(sysMsg.CANNOT_CHECKOUT_PENDING_CHECKIN);
    });

    it('should throw BadRequestException when already checked out', async () => {
      const alreadyCheckedOut = {
        ...mockAttendanceRecord,
        check_out_time: new Date(),
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(
        alreadyCheckedOut as never,
      );

      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.teacherCheckout(mockUser, checkoutDto),
      ).rejects.toThrow(sysMsg.ALREADY_CHECKED_OUT);
    });

    it('should append checkout notes to existing notes', async () => {
      const attendanceWithNotes = {
        ...mockAttendanceRecord,
        notes: 'Existing note',
      };

      const updatedAttendance = {
        ...attendanceWithNotes,
        check_out_time: new Date(),
        total_hours: 8.5,
        notes: 'Existing note | Checkout: Leaving for appointment',
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(
        attendanceWithNotes as never,
      );
      teacherDailyAttendanceModelAction.update.mockResolvedValue(
        updatedAttendance as never,
      );

      await service.teacherCheckout(mockUser, checkoutDto);

      expect(teacherDailyAttendanceModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            notes: 'Existing note | Checkout: Leaving for appointment',
          }),
        }),
      );
    });

    it('should calculate total hours worked correctly', async () => {
      // Create a check-in time 8.5 hours ago
      const checkInTime = new Date();
      checkInTime.setHours(
        checkInTime.getHours() - 8,
        checkInTime.getMinutes() - 30,
      );

      const attendanceWith8HourShift = {
        ...mockAttendanceRecord,
        check_in_time: checkInTime,
      };

      teacherModelAction.get.mockResolvedValue(mockTeacher as never);
      teacherDailyAttendanceModelAction.get.mockResolvedValue(
        attendanceWith8HourShift as never,
      );
      teacherDailyAttendanceModelAction.update.mockResolvedValue({
        ...attendanceWith8HourShift,
        check_out_time: new Date(),
        total_hours: 8.5,
      } as never);

      await service.teacherCheckout(mockUser, { notes: undefined });

      expect(teacherDailyAttendanceModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatePayload: expect.objectContaining({
            total_hours: expect.any(Number),
          }),
        }),
      );
    });
  });
});
