import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Repository } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { Class } from '../../class/entities/class.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import {
  CreateTimetableDto,
  CreateScheduleDto,
  AddScheduleDto,
} from '../dto/timetable.dto';
import { DayOfWeek } from '../enums/timetable.enums';
import { ScheduleModelAction } from '../model-actions/schedule.model-action';

@Injectable()
export class TimetableValidationService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    private readonly scheduleModelAction: ScheduleModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
  ) {
    this.logger = logger.child({ context: TimetableValidationService.name });
  }

  /**
   * Validates a single new schedule
   */
  async validateNewSchedule(dto: AddScheduleDto): Promise<void> {
    // Validate class exists
    await this.validateClass(dto.class_id);

    // Validate time range
    this.validateTimeRange(dto.start_time, dto.end_time);

    // Validate foreign keys (subject, teacher)
    await this.validateScheduleForeignKeys([dto]);

    // Validate class/day overlaps
    await this.validateClassDayOverlap(
      dto.class_id,
      dto.day,
      dto.start_time,
      dto.end_time,
    );

    // Validate teacher double-booking (if teacher is assigned)
    if (dto.teacher_id) {
      await this.validateTeacherDoubleBooking(
        dto.teacher_id,
        dto.day,
        dto.start_time,
        dto.end_time,
      );
    }
  }

  /**
   * Validates all timetable business rules
   * @param dto - Timetable creation/update DTO
   * @param excludeTimetableId - Optional ID to exclude from overlap checks (for updates)
   */
  async validateTimetableRules(
    dto: CreateTimetableDto,
    excludeTimetableId?: string,
  ): Promise<void> {
    // Validate class exists
    await this.validateClass(dto.class_id);

    // Validate schedules
    if (dto.schedules && dto.schedules.length > 0) {
      // Validate foreign keys for schedules (subjects, teachers)
      await this.validateScheduleForeignKeys(dto.schedules);

      // Validate internal overlaps (within the new timetable itself)
      this.validateInternalOverlaps(dto.schedules);

      // Validate external overlaps (against existing timetables)
      for (const schedule of dto.schedules) {
        // Validate time range
        this.validateTimeRange(schedule.start_time, schedule.end_time);

        // Validate class/day overlaps
        await this.validateClassDayOverlap(
          dto.class_id,
          schedule.day,
          schedule.start_time,
          schedule.end_time,
          excludeTimetableId,
        );

        // Validate teacher double-booking (if teacher is assigned)
        if (schedule.teacher_id) {
          await this.validateTeacherDoubleBooking(
            schedule.teacher_id,
            schedule.day,
            schedule.start_time,
            schedule.end_time,
            excludeTimetableId,
          );
        }
      }
    }
  }

  // Validates that start_time is before end_time
  private validateTimeRange(startTime: string, endTime: string): void {
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    if (start >= end) {
      this.logger.warn('Invalid time range', { startTime, endTime });
      throw new BadRequestException(sysMsg.INVALID_TIME_RANGE);
    }
  }

  private async validateClass(classId: string): Promise<void> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId },
    });

    if (!classEntity) {
      this.logger.warn('Class not found', { class_id: classId });
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }
  }

  private async validateScheduleForeignKeys(
    schedules: CreateScheduleDto[],
  ): Promise<void> {
    for (const schedule of schedules) {
      if (schedule.subject_id) {
        const subject = await this.subjectRepository.findOne({
          where: { id: schedule.subject_id },
        });
        if (!subject) {
          this.logger.warn('Subject not found', {
            subject_id: schedule.subject_id,
          });
          throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);
        }
      }

      if (schedule.teacher_id) {
        const teacher = await this.teacherRepository.findOne({
          where: { id: schedule.teacher_id },
        });
        if (!teacher) {
          this.logger.warn('Teacher not found', {
            teacher_id: schedule.teacher_id,
          });
          throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
        }
      }
    }
  }

  private validateInternalOverlaps(schedules: CreateScheduleDto[]): void {
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const s1 = schedules[i];
        const s2 = schedules[j];

        if (s1.day === s2.day) {
          if (
            this.isTimeOverlapping(
              s1.start_time,
              s1.end_time,
              s2.start_time,
              s2.end_time,
            )
          ) {
            this.logger.warn('Internal schedule overlap detected', {
              day: s1.day,
              start1: s1.start_time,
              end1: s1.end_time,
              start2: s2.start_time,
              end2: s2.end_time,
            });
            throw new ConflictException(sysMsg.TIMETABLE_INTERNAL_OVERLAP);
          }
        }
      }
    }
  }

  private async validateClassDayOverlap(
    classId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeTimetableId?: string,
  ): Promise<void> {
    const existingSchedules = await this.scheduleModelAction.findClassSchedules(
      classId,
      day,
    );

    for (const existing of existingSchedules) {
      if (excludeTimetableId && existing.timetable.id === excludeTimetableId) {
        continue;
      }

      if (
        this.isTimeOverlapping(
          startTime,
          endTime,
          existing.start_time,
          existing.end_time,
        )
      ) {
        this.logger.warn('Class day overlap detected', {
          classId,
          day,
          existingScheduleId: existing.id,
          newStartTime: startTime,
          newEndTime: endTime,
          existingStartTime: existing.start_time,
          existingEndTime: existing.end_time,
        });
        throw new ConflictException(sysMsg.TIMETABLE_OVERLAP_STREAM);
      }
    }
  }

  private async validateTeacherDoubleBooking(
    teacherId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeTimetableId?: string,
  ): Promise<void> {
    const existingSchedules =
      await this.scheduleModelAction.findTeacherSchedules(teacherId, day);

    for (const existing of existingSchedules) {
      if (excludeTimetableId && existing.timetable.id === excludeTimetableId) {
        continue;
      }

      if (
        this.isTimeOverlapping(
          startTime,
          endTime,
          existing.start_time,
          existing.end_time,
        )
      ) {
        this.logger.warn('Teacher double-booking detected', {
          teacherId,
          day,
          existingScheduleId: existing.id,
          newStartTime: startTime,
          newEndTime: endTime,
          existingStartTime: existing.start_time,
          existingEndTime: existing.end_time,
        });
        throw new ConflictException(sysMsg.TIMETABLE_TEACHER_DOUBLE_BOOKED);
      }
    }
  }

  private isTimeOverlapping(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    const start1Time = this.parseTime(start1);
    const end1Time = this.parseTime(end1);
    const start2Time = this.parseTime(start2);
    const end2Time = this.parseTime(end2);

    return start1Time < end2Time && start2Time < end1Time;
  }

  private parseTime(timeString: string): number {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }
}
