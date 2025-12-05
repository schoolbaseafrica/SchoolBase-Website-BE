import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { AcademicSessionService } from '../../academic-session/academic-session.service';
import {
  AcademicSession,
  SessionStatus,
} from '../../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { TermName } from '../../academic-term/entities/term.entity';
import { TermModelAction } from '../../academic-term/model-actions';
import { ScheduleBasedAttendance, StudentDailyAttendance } from '../entities';
import { AttendanceStatus, DailyAttendanceStatus } from '../enums';
import {
  AttendanceModelAction,
  StudentDailyAttendanceModelAction,
} from '../model-actions';
import { AttendanceService } from '../services/attendance.service';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let module: TestingModule;
  let attendanceModelAction: jest.Mocked<AttendanceModelAction>;
  let studentDailyAttendanceModelAction: jest.Mocked<StudentDailyAttendanceModelAction>;
  let academicSessionService: jest.Mocked<AcademicSessionService>;

  const mockCreate = jest.fn();
  const mockSave = jest.fn();
  const mockFindOne = jest.fn();
  const mockFind = jest.fn();
  const mockUpdate = jest.fn();

  const mockEntityManager = {
    create: mockCreate,
    save: mockSave,
    findOne: mockFindOne,
    find: mockFind,
    update: mockUpdate,
  } as unknown as EntityManager;

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

    const mockStudentDailyAttendanceModelAction = {
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

    const mockAcademicSessionService = {
      activeSessions: jest.fn(),
    };

    const mockTermModelAction = {
      get: jest.fn(),
      list: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
      manager: {
        findOne: mockFindOne,
        find: mockFind,
        createQueryBuilder: jest.fn(() => ({
          innerJoin: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([]),
          getRawMany: jest.fn().mockResolvedValue([]),
        })),
      },
    };

    module = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: AttendanceModelAction,
          useValue: mockAttendanceModelAction,
        },
        {
          provide: StudentDailyAttendanceModelAction,
          useValue: mockStudentDailyAttendanceModelAction,
        },
        {
          provide: AcademicSessionModelAction,
          useValue: mockAcademicSessionModelAction,
        },
        {
          provide: AcademicSessionService,
          useValue: mockAcademicSessionService,
        },
        {
          provide: TermModelAction,
          useValue: mockTermModelAction,
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
    studentDailyAttendanceModelAction = module.get(
      StudentDailyAttendanceModelAction,
    );
    academicSessionService = module.get(AcademicSessionService);
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

  describe('getScheduleAttendance', () => {
    it('should retrieve attendance records for a schedule and date', async () => {
      const scheduleId = 'schedule-123';
      const date = '2025-12-02';

      const mockAttendanceRecords: ScheduleBasedAttendance[] = [
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
        } as ScheduleBasedAttendance,
      ];

      attendanceModelAction.list.mockResolvedValue({
        payload: mockAttendanceRecords,
        paginationMeta: null,
      });

      const result = await service.getScheduleAttendance(scheduleId, date);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].schedule_id).toBe(scheduleId);
      expect(result.message).toBe(sysMsg.ATTENDANCE_RECORDS_RETRIEVED);
    });
  });

  describe('updateAttendance', () => {
    it('should update an attendance record', async () => {
      const attendanceId = 'attendance-123';
      const updateDto = {
        status: AttendanceStatus.PRESENT,
        notes: 'Updated',
      };

      const existingAttendance: ScheduleBasedAttendance = {
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
      } as ScheduleBasedAttendance;

      const updatedAttendance: ScheduleBasedAttendance = {
        ...existingAttendance,
        status: AttendanceStatus.PRESENT,
        notes: 'Updated',
      };

      attendanceModelAction.get.mockResolvedValue(existingAttendance);
      attendanceModelAction.update.mockResolvedValue(updatedAttendance);

      const result = await service.updateAttendance(attendanceId, updateDto);

      expect(result.data.status).toBe(AttendanceStatus.PRESENT);
      expect(result.message).toBe(sysMsg.ATTENDANCE_UPDATED_SUCCESSFULLY);
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
        payload: [{}, {}, {}] as ScheduleBasedAttendance[], // 3 records
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
      mockFindOne.mockResolvedValue({ id: 'teacher-123' });
      academicSessionService.activeSessions.mockRejectedValue(
        new NotFoundException('No active session'),
      );

      await expect(
        service.markAttendance('teacher-123', {
          schedule_id: 'schedule-123',
          date: '2025-12-02',
          attendance_records: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('markStudentDailyAttendance', () => {
    it('should mark daily attendance for a class', async () => {
      const teacherId = 'teacher-123';
      const dto = {
        class_id: 'class-123',
        date: '2025-12-02',
        attendance_records: [
          {
            student_id: 'student-001',
            status: DailyAttendanceStatus.PRESENT,
            check_in_time: '08:00:00',
          },
          {
            student_id: 'student-002',
            status: DailyAttendanceStatus.LATE,
            check_in_time: '09:15:00',
            notes: 'Traffic delay',
          },
        ],
      };

      const mockSession = {
        id: 'session-123',
        name: '2025/2026',
        is_active: true,
        status: SessionStatus.ACTIVE,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AcademicSession;

      academicSessionService.activeSessions.mockResolvedValue({
        data: mockSession,
      } as never);

      // Mock transaction to handle enrollment checks within transaction
      mockFindOne.mockResolvedValue({ id: 'enrollment-1', is_active: true });
      mockSave.mockResolvedValue({});

      const result = await service.markStudentDailyAttendance(teacherId, dto);

      expect(result.message).toBe(
        'Student daily attendance marked successfully',
      );
      expect(result.marked).toBeGreaterThanOrEqual(0);
      expect(result.total).toBe(2);
    });

    it('should throw BadRequestException for future dates', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const dto = {
        class_id: 'class-123',
        date: futureDateStr,
        attendance_records: [],
      };

      await expect(
        service.markStudentDailyAttendance('teacher-123', dto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStudentDailyAttendance', () => {
    it('should update a student daily attendance record', async () => {
      const attendanceId = 'attendance-123';
      const updateDto = {
        status: DailyAttendanceStatus.PRESENT,
        check_out_time: '15:00:00',
        notes: 'Updated',
      };

      const mockAttendance: Partial<StudentDailyAttendance> = {
        id: attendanceId,
        class_id: 'class-123',
        student_id: 'student-001',
      };

      studentDailyAttendanceModelAction.get.mockResolvedValue(
        mockAttendance as StudentDailyAttendance,
      );
      studentDailyAttendanceModelAction.update.mockResolvedValue(
        mockAttendance as StudentDailyAttendance,
      );

      const result = await service.updateStudentDailyAttendance(
        attendanceId,
        updateDto,
      );

      expect(result.message).toBe(sysMsg.ATTENDANCE_UPDATED_SUCCESSFULLY);
      expect(studentDailyAttendanceModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: attendanceId },
      });
    });
  });

  describe('getClassDailyAttendance', () => {
    it('should retrieve daily attendance records for a class', async () => {
      const classId = 'class-123';
      const date = '2025-12-02';

      mockFind.mockResolvedValue([
        {
          student: {
            id: 'student-001',
            user: { first_name: 'John', middle_name: 'A', last_name: 'Doe' },
          },
          is_active: true,
        },
        {
          student: {
            id: 'student-002',
            user: { first_name: 'Jane', middle_name: 'B', last_name: 'Smith' },
          },
          is_active: true,
        },
      ]);

      // Mock createQueryBuilder to return schedules for the class
      const mockQueryBuilder: Partial<SelectQueryBuilder<unknown>> = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'schedule-1', period_order: 1 },
          { id: 'schedule-2', period_order: 2 },
        ]),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      jest
        .spyOn(service['dataSource'].manager, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as SelectQueryBuilder<unknown>);

      const result = await service.getClassDailyAttendance(classId, date);

      expect(result.message).toBe(
        'Class daily attendance retrieved successfully',
      );
      expect(result).toHaveProperty('students');
      expect(Array.isArray(result.students)).toBe(true);
    });
  });

  describe('getClassTermAttendance', () => {
    it('should retrieve aggregated attendance summary for a class', async () => {
      const classId = 'class-123';
      const sessionId = 'session-123';
      const term = TermName.FIRST;

      // Mock term data
      const mockTerm = {
        id: 'term-123',
        name: TermName.FIRST,
        sessionId: sessionId,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-12-31'),
      };

      // Mock termModelAction.list
      jest.spyOn(service['termModelAction'], 'list').mockResolvedValue({
        payload: [mockTerm],
        paginationMeta: {},
      } as never);

      mockFind.mockResolvedValue([
        {
          student: {
            id: 'student-001',
            user: { first_name: 'John', middle_name: 'A', last_name: 'Doe' },
          },
          is_active: true,
        },
        {
          student: {
            id: 'student-002',
            user: { first_name: 'Jane', middle_name: 'B', last_name: 'Smith' },
          },
          is_active: true,
        },
      ]);

      // Mock createQueryBuilder for daily attendance records
      const mockQueryBuilder: Partial<SelectQueryBuilder<unknown>> = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            student_id: 'student-001',
            date: new Date('2025-09-01'),
            status: 'PRESENT',
          },
          {
            student_id: 'student-002',
            date: new Date('2025-09-01'),
            status: 'LATE',
          },
        ]),
      };

      jest
        .spyOn(service['dataSource'].manager, 'createQueryBuilder')
        .mockReturnValue(mockQueryBuilder as SelectQueryBuilder<unknown>);

      const result = await service.getClassTermAttendance(
        classId,
        sessionId,
        term,
      );

      expect(result.message).toBe(
        'Class term attendance retrieved successfully',
      );
      expect(result).toHaveProperty('students');
      expect(result).toHaveProperty('session_id');
      expect(result).toHaveProperty('term');
      expect(Array.isArray(result.students)).toBe(true);
    });
  });

  describe('getStudentMonthlyAttendance', () => {
    it('should retrieve monthly attendance for a student for current month', async () => {
      const studentId = 'student-123';
      const sessionId = 'session-123';

      const mockSession = {
        id: sessionId,
        name: '2025/2026',
        is_active: true,
        status: SessionStatus.ACTIVE,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AcademicSession;

      // Mock active session
      academicSessionService.activeSessions.mockResolvedValue({
        data: mockSession,
      } as never);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Create mock attendance records for current month
      const mockAttendanceRecords: Partial<StudentDailyAttendance>[] = [
        {
          id: 'attendance-1',
          student_id: studentId,
          session_id: sessionId,
          date: new Date(currentYear, currentMonth, 1),
          status: DailyAttendanceStatus.PRESENT,
          check_in_time: new Date('2025-12-01T08:00:00'),
          notes: null,
        },
        {
          id: 'attendance-2',
          student_id: studentId,
          session_id: sessionId,
          date: new Date(currentYear, currentMonth, 2),
          status: DailyAttendanceStatus.LATE,
          check_in_time: new Date('2025-12-02T09:15:00'),
          notes: 'Traffic delay',
        },
        {
          id: 'attendance-3',
          student_id: studentId,
          session_id: sessionId,
          date: new Date(currentYear, currentMonth, 3),
          status: DailyAttendanceStatus.ABSENT,
          check_in_time: null,
          notes: 'Sick leave',
        },
        {
          id: 'attendance-4',
          student_id: studentId,
          session_id: sessionId,
          date: new Date(currentYear, currentMonth, 4),
          status: DailyAttendanceStatus.EXCUSED,
          check_in_time: null,
          notes: 'Medical appointment',
        },
      ];

      studentDailyAttendanceModelAction.list.mockResolvedValue({
        payload: mockAttendanceRecords as StudentDailyAttendance[],
        paginationMeta: null,
      });

      const result = await service.getStudentMonthlyAttendance(studentId);

      expect(result.message).toBe(sysMsg.STUDENT_MONTHLY_ATTENDANCE_RETRIEVED);
      expect(result.student_id).toBe(studentId);
      expect(result.year).toBe(currentYear);
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('total_days_in_month');
      expect(result).toHaveProperty('days_present');
      expect(result).toHaveProperty('days_absent');
      expect(result).toHaveProperty('days_late');
      expect(result).toHaveProperty('days_excused');
      expect(result).toHaveProperty('days_half_day');
      expect(Array.isArray(result.attendance_details)).toBe(true);
      expect(result.attendance_details.length).toBe(4);

      // Verify statistics
      expect(result.days_present).toBe(2); // 1 PRESENT + 1 LATE
      expect(result.days_absent).toBe(1);
      expect(result.days_late).toBe(1);
      expect(result.days_excused).toBe(1);
      expect(result.days_half_day).toBe(0);

      // Verify academicSessionService was called
      expect(academicSessionService.activeSessions).toHaveBeenCalled();
    });

    it('should return empty attendance details when no records exist for current month', async () => {
      const studentId = 'student-123';
      const sessionId = 'session-123';

      const mockSession = {
        id: sessionId,
        name: '2025/2026',
        is_active: true,
        status: SessionStatus.ACTIVE,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AcademicSession;

      academicSessionService.activeSessions.mockResolvedValue({
        data: mockSession,
      } as never);

      studentDailyAttendanceModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      const result = await service.getStudentMonthlyAttendance(studentId);

      expect(result.message).toBe(sysMsg.STUDENT_MONTHLY_ATTENDANCE_RETRIEVED);
      expect(result.student_id).toBe(studentId);
      expect(result.days_present).toBe(0);
      expect(result.days_absent).toBe(0);
      expect(result.days_late).toBe(0);
      expect(result.days_excused).toBe(0);
      expect(result.days_half_day).toBe(0);
      expect(result.attendance_details).toEqual([]);
    });
  });

  // ================== START: Parent getChildMonthlyAttendance by registration_number ==================
  describe('getParentChildMonthlyAttendance', () => {
    it('should retrieve monthly attendance for a child using registration_number', async () => {
      const registrationNumber = 'STU-2025-0015';
      const studentId = 'student-123';
      const sessionId = 'session-123';

      const mockSession = {
        id: sessionId,
        name: '2025/2026',
        is_active: true,
        status: SessionStatus.ACTIVE,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AcademicSession;

      // Mock active session
      academicSessionService.activeSessions.mockResolvedValue({
        data: mockSession,
      } as never);

      // Mock student lookup by registration_number
      mockFindOne.mockResolvedValue({
        id: studentId,
        registration_number: registrationNumber,
        user: { first_name: 'John', middle_name: 'A', last_name: 'Doe' },
      });

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Create mock attendance records for current month
      const mockAttendanceRecords: Partial<StudentDailyAttendance>[] = [
        {
          id: 'attendance-1',
          student_id: studentId,
          session_id: sessionId,
          date: new Date(currentYear, currentMonth, 1),
          status: DailyAttendanceStatus.PRESENT,
          check_in_time: new Date('2025-12-01T08:00:00'),
          notes: null,
        },
        {
          id: 'attendance-2',
          student_id: studentId,
          session_id: sessionId,
          date: new Date(currentYear, currentMonth, 2),
          status: DailyAttendanceStatus.LATE,
          check_in_time: new Date('2025-12-02T09:15:00'),
          notes: 'Traffic delay',
        },
      ];

      studentDailyAttendanceModelAction.list.mockResolvedValue({
        payload: mockAttendanceRecords as StudentDailyAttendance[],
        paginationMeta: null,
      });

      const result =
        await service.getParentChildMonthlyAttendance(registrationNumber);

      expect(result.message).toBe(sysMsg.STUDENT_MONTHLY_ATTENDANCE_RETRIEVED);
      expect(result.registration_number).toBe(registrationNumber);
      expect(result.student_id).toBe(studentId);
      expect(result.year).toBe(currentYear);
      expect(result).toHaveProperty('month');
      expect(result.attendance_details.length).toBe(2);
      expect(result.days_present).toBe(2); // PRESENT + LATE counts as present
      expect(result.days_late).toBe(1);
    });

    it('should return empty attendance details when no records exist for current month', async () => {
      const registrationNumber = 'STU-2025-0015';
      const studentId = 'student-123';
      const sessionId = 'session-123';

      const mockSession = {
        id: sessionId,
        name: '2025/2026',
        is_active: true,
        status: SessionStatus.ACTIVE,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-08-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as AcademicSession;

      academicSessionService.activeSessions.mockResolvedValue({
        data: mockSession,
      } as never);

      // Mock student lookup by registration_number
      mockFindOne.mockResolvedValue({
        id: studentId,
        registration_number: registrationNumber,
        user: { first_name: 'John', middle_name: 'A', last_name: 'Doe' },
      });

      studentDailyAttendanceModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: null,
      });

      const result =
        await service.getParentChildMonthlyAttendance(registrationNumber);

      expect(result.message).toBe(sysMsg.STUDENT_MONTHLY_ATTENDANCE_RETRIEVED);
      expect(result.registration_number).toBe(registrationNumber);
      expect(result.attendance_details).toEqual([]);
      expect(result.days_present).toBe(0);
      expect(result.days_absent).toBe(0);
      expect(result.days_late).toBe(0);
      expect(result.days_excused).toBe(0);
      expect(result.days_half_day).toBe(0);
    });
  });
  // ================== END: Parent getChildMonthlyAttendance by registration_number ==================
});
