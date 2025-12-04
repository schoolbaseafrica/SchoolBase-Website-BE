import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { Class } from '../../class/entities/class.entity';
import { Room } from '../../room/entities/room.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { AddScheduleDto, CreateTimetableDto } from '../dto/timetable.dto';
import { Schedule } from '../entities/schedule.entity';
import { DayOfWeek, PeriodType } from '../enums/timetable.enums';
import { ScheduleModelAction } from '../model-actions/schedule.model-action';

import { TimetableValidationService } from './timetable-validation.service';

describe('TimetableValidationService', () => {
  let service: TimetableValidationService;
  let classRepository: jest.Mocked<Repository<Class>>;
  let subjectRepository: jest.Mocked<Repository<Subject>>;
  let teacherRepository: jest.Mocked<Repository<Teacher>>;
  let roomRepository: jest.Mocked<Repository<Room>>;
  let mockScheduleModelAction: jest.Mocked<ScheduleModelAction>;

  const mockClassId = 'stream-123';
  const mockSubjectId = 'subject-123';
  const mockTeacherId = 'teacher-123';

  const baseDto: CreateTimetableDto = {
    class_id: mockClassId,
    schedules: [
      {
        day: DayOfWeek.MONDAY,
        start_time: '09:00:00',
        end_time: '10:00:00',
        period_type: PeriodType.ACADEMICS,
      },
    ],
  };

  beforeEach(async () => {
    const mockLogger = {
      child: jest.fn().mockReturnValue({
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
      }),
    } as unknown as Logger;

    classRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Class>>;

    subjectRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Subject>>;

    teacherRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Teacher>>;

    roomRepository = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<Repository<Room>>;

    mockScheduleModelAction = {
      findClassSchedules: jest.fn(),
      findTeacherSchedules: jest.fn(),
      findRoomSchedules: jest.fn(),
    } as unknown as jest.Mocked<ScheduleModelAction>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableValidationService,
        {
          provide: getRepositoryToken(Class),
          useValue: classRepository,
        },
        {
          provide: getRepositoryToken(Subject),
          useValue: subjectRepository,
        },
        {
          provide: getRepositoryToken(Teacher),
          useValue: teacherRepository,
        },
        {
          provide: getRepositoryToken(Room),
          useValue: roomRepository,
        },
        {
          provide: ScheduleModelAction,
          useValue: mockScheduleModelAction,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<TimetableValidationService>(
      TimetableValidationService,
    );
    classRepository = module.get(getRepositoryToken(Class));
    subjectRepository = module.get(getRepositoryToken(Subject));
    teacherRepository = module.get(getRepositoryToken(Teacher));
    roomRepository = module.get(getRepositoryToken(Room));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateTimetableRules', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should pass validation for valid timetable', async () => {
      // Setup mocks
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);

      mockScheduleModelAction.findClassSchedules.mockResolvedValue([]);
      mockScheduleModelAction.findTeacherSchedules.mockResolvedValue([]);

      const dto: CreateTimetableDto = {
        ...baseDto,
        schedules: [
          {
            ...baseDto.schedules[0],
            subject_id: mockSubjectId,
            teacher_id: mockTeacherId,
          },
        ],
      };

      subjectRepository.findOne.mockResolvedValue({
        id: mockSubjectId,
      } as Subject);
      teacherRepository.findOne.mockResolvedValue({
        id: mockTeacherId,
      } as Teacher);

      await expect(service.validateTimetableRules(dto)).resolves.not.toThrow();
    });
  });

  describe('validateNewSchedule', () => {
    const addScheduleDto: AddScheduleDto = {
      class_id: mockClassId,
      day: DayOfWeek.MONDAY,
      start_time: '09:00:00',
      end_time: '10:00:00',
      period_type: PeriodType.ACADEMICS,
      subject_id: mockSubjectId,
      teacher_id: mockTeacherId,
    };

    it('should validate foreign keys', async () => {
      // Setup mocks
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);
      mockScheduleModelAction.findClassSchedules.mockResolvedValue([]);
      mockScheduleModelAction.findTeacherSchedules.mockResolvedValue([]);

      subjectRepository.findOne.mockResolvedValue({
        id: mockSubjectId,
      } as Subject);
      teacherRepository.findOne.mockResolvedValue({
        id: mockTeacherId,
      } as Teacher);

      await expect(
        service.validateNewSchedule(addScheduleDto),
      ).resolves.not.toThrow();

      expect(classRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockClassId },
      });
      expect(subjectRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockSubjectId },
      });
      expect(teacherRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTeacherId },
      });
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      // Setup mocks
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);
      mockScheduleModelAction.findClassSchedules.mockResolvedValue([]);
      mockScheduleModelAction.findTeacherSchedules.mockResolvedValue([]);

      subjectRepository.findOne.mockResolvedValue(null);

      await expect(service.validateNewSchedule(addScheduleDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateNewSchedule(addScheduleDto)).rejects.toThrow(
        sysMsg.SUBJECT_NOT_FOUND,
      );
    });
  });

  describe('Time Range Validation', () => {
    it('should throw BadRequestException when start_time >= end_time', async () => {
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);

      const dto: CreateTimetableDto = {
        ...baseDto,
        schedules: [
          {
            ...baseDto.schedules[0],
            start_time: '10:00:00',
            end_time: '09:00:00', // End before start
          },
        ],
      };

      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        sysMsg.INVALID_TIME_RANGE,
      );
    });
  });

  describe('Foreign Key Validation', () => {
    it('should throw NotFoundException when class does not exist', async () => {
      classRepository.findOne.mockResolvedValue(null);

      await expect(service.validateTimetableRules(baseDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateTimetableRules(baseDto)).rejects.toThrow(
        sysMsg.CLASS_NOT_FOUND,
      );
    });

    it('should throw NotFoundException when subject does not exist', async () => {
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);
      subjectRepository.findOne.mockResolvedValue(null);

      const dto: CreateTimetableDto = {
        ...baseDto,
        schedules: [
          {
            ...baseDto.schedules[0],
            subject_id: 'invalid-subject-id',
          },
        ],
      };

      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        sysMsg.SUBJECT_NOT_FOUND,
      );
    });
  });

  describe('Class/Day Overlap Validation', () => {
    it('should throw ConflictException when class has overlapping time on same day', async () => {
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);

      const existingSchedule: Schedule = {
        id: 'existing-id',
        day: DayOfWeek.MONDAY,
        start_time: '09:00:00',
        end_time: '10:00:00',
        timetable: {
          class_id: mockClassId,
          is_active: true,
        },
      } as unknown as Schedule;

      mockScheduleModelAction.findClassSchedules.mockResolvedValue([
        existingSchedule,
      ]);

      const dto: CreateTimetableDto = {
        ...baseDto,
        schedules: [
          {
            ...baseDto.schedules[0],
            start_time: '09:30:00', // Overlaps with existing 9:00-10:00
            end_time: '10:30:00',
          },
        ],
      };

      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        sysMsg.TIMETABLE_OVERLAP_STREAM,
      );
    });
  });

  describe('Teacher Double-Booking Validation', () => {
    it('should throw ConflictException when teacher is double-booked', async () => {
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);
      teacherRepository.findOne.mockResolvedValue({
        id: mockTeacherId,
      } as Teacher);

      const existingSchedule: Schedule = {
        id: 'existing-id',
        teacher_id: mockTeacherId,
        day: DayOfWeek.MONDAY,
        start_time: '09:00:00',
        end_time: '10:00:00',
        timetable: {
          class_id: 'different-class',
          is_active: true,
        },
      } as unknown as Schedule;

      mockScheduleModelAction.findClassSchedules.mockResolvedValue([]);
      mockScheduleModelAction.findTeacherSchedules.mockResolvedValue([
        existingSchedule,
      ]);

      const dto: CreateTimetableDto = {
        ...baseDto,
        schedules: [
          {
            ...baseDto.schedules[0],
            teacher_id: mockTeacherId,
            start_time: '09:30:00',
            end_time: '10:30:00',
          },
        ],
      };

      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        sysMsg.TIMETABLE_TEACHER_DOUBLE_BOOKED,
      );
    });
  });

  describe('Room Double-Booking Validation', () => {
    const mockRoomId = 'room-123';

    it('should throw ConflictException when room is double-booked', async () => {
      classRepository.findOne.mockResolvedValue({
        id: mockClassId,
      } as Class);
      roomRepository.findOne.mockResolvedValue({
        id: mockRoomId,
      } as Room);

      const existingSchedule: Schedule = {
        id: 'existing-id',
        room_id: mockRoomId,
        day: DayOfWeek.MONDAY,
        start_time: '09:00:00',
        end_time: '10:00:00',
        timetable: {
          class_id: 'different-class',
          is_active: true,
        },
      } as unknown as Schedule;

      mockScheduleModelAction.findClassSchedules.mockResolvedValue([]);
      mockScheduleModelAction.findTeacherSchedules.mockResolvedValue([]);
      mockScheduleModelAction.findRoomSchedules.mockResolvedValue([
        existingSchedule,
      ]);

      const dto: CreateTimetableDto = {
        ...baseDto,
        schedules: [
          {
            ...baseDto.schedules[0],
            room_id: mockRoomId,
            start_time: '09:30:00',
            end_time: '10:30:00',
          },
        ],
      };

      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.validateTimetableRules(dto)).rejects.toThrow(
        sysMsg.TIMETABLE_ROOM_DOUBLE_BOOKED,
      );
    });
  });
});
