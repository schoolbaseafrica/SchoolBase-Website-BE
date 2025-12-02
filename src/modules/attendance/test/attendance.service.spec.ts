import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager } from 'typeorm';

import {
  ATTENDANCE_RECORDS_RETRIEVED,
  ATTENDANCE_UPDATED_SUCCESSFULLY,
} from 'src/constants/system.messages';

import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { AttendanceService } from '../attendance.service';
import { Attendance } from '../entities';
import { AttendanceStatus } from '../enums';
import { AttendanceModelAction } from '../model-actions';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceModelAction: jest.Mocked<AttendanceModelAction>;
  let academicSessionModelAction: jest.Mocked<AcademicSessionModelAction>;

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockBaseLogger = {
    child: jest.fn().mockReturnValue(mockLogger),
  };

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

    const mockDataSource = {
      transaction: jest.fn(
        (callback: (manager: EntityManager) => Promise<unknown>) =>
          callback({
            findOne: jest.fn(),
            update: jest.fn(),
          } as unknown as EntityManager),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
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
          useValue: mockDataSource,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockBaseLogger,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    attendanceModelAction = module.get(AttendanceModelAction);
    academicSessionModelAction = module.get(AcademicSessionModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getScheduleAttendance', () => {
    it('should retrieve attendance records for a schedule and date', async () => {
      const scheduleId = 'schedule-123';
      const date = '2025-12-02';

      const mockAttendanceRecords: Attendance[] = [
        {
          id: 'attendance-1',
          schedule_id: scheduleId,
          student_id: 'student-001',
          session_id: 'session-123',
          date: new Date(date),
          status: AttendanceStatus.PRESENT,
          marked_by: 'teacher-456',
          marked_at: new Date(),
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Attendance,
      ];

      attendanceModelAction.list.mockResolvedValue({
        payload: mockAttendanceRecords,
        paginationMeta: null,
      });

      const result = await service.getScheduleAttendance(scheduleId, date);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].schedule_id).toBe(scheduleId);
      expect(result.message).toBe(ATTENDANCE_RECORDS_RETRIEVED);
    });
  });

  describe('updateAttendance', () => {
    it('should update an attendance record', async () => {
      const attendanceId = 'attendance-123';
      const updateDto = {
        status: AttendanceStatus.PRESENT,
        notes: 'Updated',
      };

      const existingAttendance: Attendance = {
        id: attendanceId,
        schedule_id: 'schedule-123',
        student_id: 'student-001',
        session_id: 'session-123',
        date: new Date(),
        status: AttendanceStatus.ABSENT,
        marked_by: 'teacher-456',
        marked_at: new Date(),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Attendance;

      const updatedAttendance: Attendance = {
        ...existingAttendance,
        status: AttendanceStatus.PRESENT,
        notes: 'Updated',
      };

      attendanceModelAction.get.mockResolvedValue(existingAttendance);
      attendanceModelAction.update.mockResolvedValue(updatedAttendance);

      const result = await service.updateAttendance(attendanceId, updateDto);

      expect(result.data.status).toBe(AttendanceStatus.PRESENT);
      expect(result.message).toBe(ATTENDANCE_UPDATED_SUCCESSFULLY);
    });

    it('should throw NotFoundException when attendance record does not exist', async () => {
      attendanceModelAction.get.mockResolvedValue(null);

      await expect(
        service.updateAttendance('non-existent', {
          status: AttendanceStatus.PRESENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isAttendanceMarked', () => {
    it('should return true when attendance is marked', async () => {
      const scheduleId = 'schedule-123';
      const date = '2025-12-02';

      attendanceModelAction.list.mockResolvedValue({
        payload: [{}, {}, {}] as Attendance[], // 3 records
        paginationMeta: null,
      });

      const result = await service.isAttendanceMarked(scheduleId, date);

      expect(result.is_marked).toBe(true);
      expect(result.count).toBe(3);
    });

    it('should return false when no attendance is marked', async () => {
      attendanceModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      const result = await service.isAttendanceMarked(
        'schedule-123',
        '2025-12-02',
      );

      expect(result.is_marked).toBe(false);
      expect(result.count).toBe(0);
    });
  });

  describe('markAttendance - validation', () => {
    it('should throw BadRequestException for future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const futureDto = {
        schedule_id: 'schedule-123',
        date: futureDateStr,
        attendance_records: [],
      };

      await expect(
        service.markAttendance('teacher-123', futureDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when no active session exists', async () => {
      academicSessionModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      await expect(
        service.markAttendance('teacher-123', {
          schedule_id: 'schedule-123',
          date: '2025-12-02',
          attendance_records: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
