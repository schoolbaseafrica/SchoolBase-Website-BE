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
import { CreateTimetableDto } from '../dto/timetable.dto';
import { Timetable } from '../entities/timetable.entity';
import { DayOfWeek } from '../enums/timetable.enums';

@Injectable()
export class TimetableValidationService {
  private readonly logger: Logger;

  // Far future date used to represent NULL end_date in date range overlap calculations.
  private readonly far_future_date = '9999-12-31';

  constructor(
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(Teacher)
    private readonly teacherRepository: Repository<Teacher>,
    @InjectRepository(Timetable)
    private readonly timetableRepository: Repository<Timetable>,
    @Inject(WINSTON_MODULE_PROVIDER) logger: Logger,
  ) {
    this.logger = logger.child({ context: TimetableValidationService.name });
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
    // Validate time range
    this.validateTimeRange(dto.start_time, dto.end_time);

    // Validate date range
    if (dto.end_date) {
      this.validateDateRange(dto.effective_date, dto.end_date);
    }

    // Validate foreign keys
    await this.validateForeignKeys(dto);

    // Validate class/day overlaps
    await this.validateClassDayOverlap(
      dto.class_id,
      dto.day,
      dto.start_time,
      dto.end_time,
      dto.effective_date,
      dto.end_date,
      excludeTimetableId,
    );

    // Validate teacher double-booking (if teacher is assigned)
    if (dto.teacher_id) {
      await this.validateTeacherDoubleBooking(
        dto.teacher_id,
        dto.day,
        dto.start_time,
        dto.end_time,
        dto.effective_date,
        dto.end_date,
        excludeTimetableId,
      );
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

  // Validates that effective_date is before end_date
  // Uses getTime() for reliable date comparison to avoid timezone issues

  private validateDateRange(effectiveDate: string, endDate: string): void {
    const effective = this.parseDate(effectiveDate);
    const end = this.parseDate(endDate);

    if (end.getTime() <= effective.getTime()) {
      this.logger.warn('Invalid date range', { effectiveDate, endDate });
      throw new BadRequestException(sysMsg.INVALID_DATE_RANGE_TIMETABLE);
    }
  }

  /**
   * Parses a date string (YYYY-MM-DD) to a Date object in local timezone
   * This avoids timezone conversion issues when comparing dates
   */
  private parseDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // Validates that all foreign keys exist
  private async validateForeignKeys(dto: CreateTimetableDto): Promise<void> {
    // Validate class (required)
    const classEntity = await this.classRepository.findOne({
      where: { id: dto.class_id },
    });

    if (!classEntity) {
      this.logger.warn('Class not found', { class_id: dto.class_id });
      throw new NotFoundException(sysMsg.CLASS_NOT_FOUND);
    }

    // Validate subject (optional)
    if (dto.subject_id) {
      const subject = await this.subjectRepository.findOne({
        where: { id: dto.subject_id },
      });

      if (!subject) {
        this.logger.warn('Subject not found', { subject_id: dto.subject_id });
        throw new NotFoundException(sysMsg.SUBJECT_NOT_FOUND);
      }
    }

    // Validate teacher (optional)
    if (dto.teacher_id) {
      const teacher = await this.teacherRepository.findOne({
        where: { id: dto.teacher_id },
      });

      if (!teacher) {
        this.logger.warn('Teacher not found', { teacher_id: dto.teacher_id });
        throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
      }
    }
  }

  /**
   * Validates that there are no overlapping periods for the same class on the same day
   * Uses canonical interval overlap formula: A_start <= B_end AND A_end >= B_start
   * Considers date ranges (effective_date and end_date) for active timetables
   */
  private async validateClassDayOverlap(
    classId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    effectiveDate: string,
    endDate: string | undefined,
    excludeTimetableId?: string,
  ): Promise<void> {
    // Use far future date string if end_date is null (represents indefinite schedule)
    // Pass date strings directly to TypeORM to avoid time/timezone contamination
    const endDateString = endDate || this.far_future_date;

    const queryBuilder = this.timetableRepository
      .createQueryBuilder('timetable')
      .where('timetable.class_id = :classId', { classId })
      .andWhere('timetable.day = :day', { day })
      .andWhere('timetable.is_active = :isActive', { isActive: true });

    // Exclude current timetable if updating
    if (excludeTimetableId) {
      queryBuilder.andWhere('timetable.id != :excludeId', {
        excludeId: excludeTimetableId,
      });
    }

    // --- Date Range Overlap (Canonical Logic) ---
    // Two intervals [A_start, A_end] and [B_start, B_end] overlap if:
    // A_start <= B_end AND A_end >= B_start
    // Where:
    //   A_start = :effectiveDate (new timetable start - date string)
    //   A_end = :endDate (new timetable end - date string, or FAR_FUTURE_DATE if null)
    //   B_start = timetable.effective_date (existing timetable start)
    //   B_end = timetable.end_date (existing timetable end, or NULL if indefinite)
    // Note: Passing date strings directly ensures clean 'YYYY-MM-DD' format without time/timezone issues
    queryBuilder
      .andWhere(
        `(
          timetable.end_date IS NULL
          OR :effectiveDate <= timetable.end_date
        )`,
        { effectiveDate },
      )
      .andWhere(`:endDate >= timetable.effective_date`, {
        endDate: endDateString,
      });

    const existingTimetables = await queryBuilder.getMany();

    // Check for time overlaps (must be done in application layer)
    for (const existing of existingTimetables) {
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
          existingTimetableId: existing.id,
          newStartTime: startTime,
          newEndTime: endTime,
          existingStartTime: existing.start_time,
          existingEndTime: existing.end_time,
        });
        throw new ConflictException(sysMsg.TIMETABLE_OVERLAP_STREAM);
      }
    }
  }

  /**
   * Validates that a teacher is not double-booked at the same time
   * Uses canonical interval overlap formula: A_start <= B_end AND A_end >= B_start
   * Considers date ranges (effective_date and end_date) for active timetables
   */
  private async validateTeacherDoubleBooking(
    teacherId: string,
    day: DayOfWeek,
    startTime: string,
    endTime: string,
    effectiveDate: string,
    endDate: string | undefined,
    excludeTimetableId?: string,
  ): Promise<void> {
    const endDateString = endDate || this.far_future_date;

    const queryBuilder = this.timetableRepository
      .createQueryBuilder('timetable')
      .where('timetable.teacher_id = :teacherId', { teacherId })
      .andWhere('timetable.day = :day', { day })
      .andWhere('timetable.is_active = :isActive', { isActive: true });

    // Exclude current timetable if updating
    if (excludeTimetableId) {
      queryBuilder.andWhere('timetable.id != :excludeId', {
        excludeId: excludeTimetableId,
      });
    }

    queryBuilder
      .andWhere(
        `(
          timetable.end_date IS NULL
          OR :effectiveDate <= timetable.end_date
        )`,
        { effectiveDate },
      )
      .andWhere(`:endDate >= timetable.effective_date`, {
        endDate: endDateString,
      });

    const existingTimetables = await queryBuilder.getMany();

    for (const existing of existingTimetables) {
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
          existingTimetableId: existing.id,
          newStartTime: startTime,
          newEndTime: endTime,
          existingStartTime: existing.start_time,
          existingEndTime: existing.end_time,
        });
        throw new ConflictException(sysMsg.TIMETABLE_TEACHER_DOUBLE_BOOKED);
      }
    }
  }

  /**
   * Checks if two time ranges overlap
   * Two time ranges overlap if:
   * - start1 < end2 AND start2 < end1
   */
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

    // Overlap occurs if: start1 < end2 AND start2 < end1
    return start1Time < end2Time && start2Time < end1Time;
  }

  /**
   * Parses a time string (HH:MM:SS or HH:MM) to minutes since midnight
   */
  private parseTime(timeString: string): number {
    const parts = timeString.split(':');
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    return hours * 60 + minutes;
  }
}
