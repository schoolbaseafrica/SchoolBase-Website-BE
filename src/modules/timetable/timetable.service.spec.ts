import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { ClassModelAction } from '../class/model-actions/class.actions';

import { AddScheduleDto } from './dto/timetable.dto';
import { Schedule } from './entities/schedule.entity';
import { Timetable } from './entities/timetable.entity';
import { DayOfWeek, PeriodType } from './enums/timetable.enums';
import { ScheduleModelAction } from './model-actions/schedule.model-action';
import { TimetableModelAction } from './model-actions/timetable.model-action';
import { TimetableValidationService } from './services/timetable-validation.service';
import { TimetableService } from './timetable.service';

describe('TimetableService', () => {
  let service: TimetableService;
  let timetableModelAction: jest.Mocked<TimetableModelAction>;
  let validationService: jest.Mocked<TimetableValidationService>;
  let scheduleModelAction: jest.Mocked<ScheduleModelAction>;
  let classModelAction: jest.Mocked<ClassModelAction>;

  const mockClassId = 'class-123';
  const mockTimetableId = 'timetable-123';
  const mockScheduleId = 'schedule-123';

  beforeEach(async () => {
    timetableModelAction = {
      get: jest.fn(),
      create: jest.fn(),
      findTimetableByClassId: jest.fn(),
    } as unknown as jest.Mocked<TimetableModelAction>;

    validationService = {
      validateNewSchedule: jest.fn(),
    } as unknown as jest.Mocked<TimetableValidationService>;

    scheduleModelAction = {
      create: jest.fn(),
    } as unknown as jest.Mocked<ScheduleModelAction>;

    classModelAction = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ClassModelAction>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableService,
        { provide: TimetableModelAction, useValue: timetableModelAction },
        { provide: TimetableValidationService, useValue: validationService },
        { provide: ScheduleModelAction, useValue: scheduleModelAction },
        { provide: ClassModelAction, useValue: classModelAction },
      ],
    }).compile();

    service = module.get<TimetableService>(TimetableService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addSchedule', () => {
    const addScheduleDto: AddScheduleDto = {
      class_id: mockClassId,
      day: DayOfWeek.MONDAY,
      start_time: '09:00:00',
      end_time: '10:00:00',
      period_type: PeriodType.ACADEMIC,
      subject_id: 'subject-123',
      teacher_id: 'teacher-123',
    };

    it('should successfully add a schedule', async () => {
      timetableModelAction.get.mockResolvedValue({
        id: mockTimetableId,
      } as Timetable);
      scheduleModelAction.create.mockResolvedValue({
        id: mockScheduleId,
        ...addScheduleDto,
        timetable: { id: mockTimetableId },
      } as unknown as Schedule);

      const result = await service.addSchedule(addScheduleDto);

      expect(validationService.validateNewSchedule).toHaveBeenCalledWith(
        addScheduleDto,
      );
      expect(timetableModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { class_id: mockClassId },
      });
      expect(scheduleModelAction.create).toHaveBeenCalledWith({
        createPayload: {
          ...addScheduleDto,
          timetable: { id: mockTimetableId },
        },
        transactionOptions: { useTransaction: false },
      });
      expect(result).toBeDefined();
      expect(result.timetable).toBeUndefined(); // Should be deleted
    });

    it('should throw NotFoundException if class does not exist', async () => {
      classModelAction.get.mockResolvedValue(null);
      validationService.validateNewSchedule.mockRejectedValue(
        new NotFoundException('Class not found'),
      );

      await expect(service.addSchedule(addScheduleDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a new timetable if one does not exist', async () => {
      timetableModelAction.get.mockResolvedValue(null);
      timetableModelAction.create.mockResolvedValue({
        id: mockTimetableId,
      } as Timetable);
      scheduleModelAction.create.mockResolvedValue({
        id: mockScheduleId,
        ...addScheduleDto,
        timetable: { id: mockTimetableId },
      } as unknown as Schedule);

      await service.addSchedule(addScheduleDto);

      expect(timetableModelAction.create).toHaveBeenCalledWith({
        createPayload: {
          class_id: mockClassId,
          is_active: true,
        },
        transactionOptions: { useTransaction: false },
      });
    });

    it('should throw BadRequestException if subject is missing for lesson', async () => {
      const invalidDto = { ...addScheduleDto, subject_id: undefined };

      await expect(
        service.addSchedule(invalidDto as unknown as AddScheduleDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByClass', () => {
    it('should return timetable with schedules', async () => {
      const mockTimetable = {
        class_id: mockClassId,
        schedules: [],
      };
      timetableModelAction.findTimetableByClassId.mockResolvedValue({
        id: mockTimetableId,
        ...mockTimetable,
      } as Timetable);

      const result = await service.findByClass(mockClassId);

      expect(timetableModelAction.findTimetableByClassId).toHaveBeenCalledWith(
        mockClassId,
      );
      expect(result).toEqual(mockTimetable);
    });

    it('should return empty structure if timetable not found', async () => {
      timetableModelAction.findTimetableByClassId.mockResolvedValue(null);

      const result = await service.findByClass(mockClassId);

      expect(result).toEqual({
        class_id: mockClassId,
        schedules: [],
      });
    });
  });
});
