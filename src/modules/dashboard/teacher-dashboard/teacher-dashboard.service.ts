import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { Schedule } from '../../timetable/entities/schedule.entity';
import { DayOfWeek } from '../../timetable/enums/timetable.enums';
import { ScheduleModelAction } from '../../timetable/model-actions/schedule.model-action';

import {
  TodaysClassDto,
  TodaysClassesResponseDto,
} from './dto/teacher-dashboard-response.dto';

@Injectable()
export class TeacherDashboardService {
  private readonly logger: Logger;

  constructor(
    private readonly scheduleModelAction: ScheduleModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: TeacherDashboardService.name });
  }

  async getTodaysClasses(teacherId: string): Promise<TodaysClassesResponseDto> {
    this.logger.info(`Fetching today's classes for teacher ${teacherId}`);

    // Get current day of week
    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase() as DayOfWeek;

    this.logger.info(`Current day: ${today}`);

    // Fetch all schedules for this teacher
    const { payload: schedules } = await this.scheduleModelAction.list({
      filterRecordOptions: {
        teacher_id: teacherId,
      },
      relations: {
        timetable: { class: true },
        subject: true,
      },
    });

    if (!schedules || schedules.length === 0) {
      this.logger.info(`No classes found for teacher ${teacherId}`);
      return {
        todays_classes: [],
        total_classes: 0,
      };
    }

    // Filter for today's day and active timetables
    const todaysSchedules = schedules.filter(
      (schedule) =>
        schedule.day === today && schedule.timetable?.is_active !== false,
    );

    if (todaysSchedules.length === 0) {
      this.logger.info(`No classes found for teacher ${teacherId} on ${today}`);
      return {
        todays_classes: [],
        total_classes: 0,
      };
    }

    // Deduplicate schedules (handle data duplication edge case)
    const uniqueSchedules = this.deduplicateSchedules(todaysSchedules);

    // Map to DTO and filter out any with missing critical data
    const todaysClasses: TodaysClassDto[] = [];

    for (const schedule of uniqueSchedules) {
      // Skip if missing critical metadata
      if (!schedule.timetable?.class) {
        this.logger.warn(
          `Schedule ${schedule.id} missing class metadata, skipping`,
        );
        continue;
      }

      const classDto: TodaysClassDto = {
        schedule_id: schedule.id,
        class_name: schedule.timetable.class.name,
        class_id: schedule.timetable.class.id,
        subject_name: schedule.subject?.name || 'Break',
        subject_id: schedule.subject?.id || '',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room || null,
      };

      todaysClasses.push(classDto);
    }

    // Sort by start time
    todaysClasses.sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Check for overlapping sessions and log warning
    this.checkForOverlaps(todaysClasses);

    this.logger.info(
      `Found ${todaysClasses.length} classes for teacher ${teacherId} on ${today}`,
    );

    return {
      todays_classes: todaysClasses,
      total_classes: todaysClasses.length,
    };
  }

  /**
   * Deduplicate schedules by schedule_id
   */
  private deduplicateSchedules(schedules: Schedule[]): Schedule[] {
    const seen = new Set<string>();
    const unique: Schedule[] = [];

    for (const schedule of schedules) {
      if (!seen.has(schedule.id)) {
        seen.add(schedule.id);
        unique.push(schedule);
      } else {
        this.logger.warn(`Duplicate schedule detected: ${schedule.id}`);
      }
    }

    return unique;
  }

  /**
   * Check for overlapping time slots and log warnings
   */
  private checkForOverlaps(classes: TodaysClassDto[]): void {
    for (let i = 0; i < classes.length - 1; i++) {
      const current = classes[i];
      const next = classes[i + 1];

      // Check if current end time is after next start time
      if (current.end_time > next.start_time) {
        this.logger.warn(
          `Overlapping sessions detected: ${current.class_name} (${current.start_time}-${current.end_time}) overlaps with ${next.class_name} (${next.start_time}-${next.end_time})`,
        );
      }
    }
  }
}
