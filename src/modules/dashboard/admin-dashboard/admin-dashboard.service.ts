import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { TimetableModelAction } from '../../timetable/model-actions/timetable.model-action';

import {
  AdminDashboardDataDto,
  TodayActivityDto,
} from './dto/admin-dashboard-response.dto';

@Injectable()
export class AdminDashboardService {
  private readonly logger: Logger;

  constructor(
    private readonly timetableModelAction: TimetableModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: AdminDashboardService.name });
  }

  async loadTodayActivities(): Promise<AdminDashboardDataDto> {
    this.logger.info("Loading today's activities for admin dashboard");

    // Get today's day of week
    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase();

    this.logger.info(`Fetching activities for ${today}`);

    // Fetch all timetables with schedules for today
    const { payload: timetables } = await this.timetableModelAction.list({
      filterRecordOptions: { is_active: true },
      relations: {
        schedules: {
          teacher: { user: true },
          subject: true,
        },
        class: true,
      },
    });

    // Extract and filter schedules for today
    const todaysActivities: TodayActivityDto[] = [];

    for (const timetable of timetables) {
      if (!timetable.schedules || timetable.schedules.length === 0) {
        continue;
      }

      const todaysSchedules = timetable.schedules.filter(
        (schedule) => schedule.day === today,
      );

      for (const schedule of todaysSchedules) {
        const activity: TodayActivityDto = {
          schedule_id: schedule.id,
          teacher: schedule.teacher
            ? {
                id: schedule.teacher.id,
                title: schedule.teacher.title || '',
                first_name: schedule.teacher.user?.first_name || '',
                last_name: schedule.teacher.user?.last_name || '',
                full_name:
                  `${schedule.teacher.title || ''} ${schedule.teacher.user?.first_name || ''} ${schedule.teacher.user?.last_name || ''}`.trim(),
              }
            : null,
          subject: schedule.subject
            ? {
                id: schedule.subject.id,
                name: schedule.subject.name,
              }
            : null,
          class: {
            id: timetable.class.id,
            name: timetable.class.name,
          },
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          venue: schedule.room || null,
          period_type: schedule.period_type,
          progress_status: this.calculateProgressStatus(
            schedule.start_time,
            schedule.end_time,
          ),
        };

        todaysActivities.push(activity);
      }
    }

    // Sort by start time
    todaysActivities.sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Calculate summary statistics
    const summary = {
      total_activities: todaysActivities.length,
      completed_activities: todaysActivities.filter(
        (a) => a.progress_status === 'COMPLETED',
      ).length,
      in_progress_activities: todaysActivities.filter(
        (a) => a.progress_status === 'IN_PROGRESS',
      ).length,
      upcoming_activities: todaysActivities.filter(
        (a) => a.progress_status === 'NOT_STARTED',
      ).length,
      activities_with_no_teacher: todaysActivities.filter((a) => !a.teacher)
        .length,
    };

    this.logger.info(
      `Loaded ${todaysActivities.length} activities for today with ${summary.activities_with_no_teacher} missing teachers`,
    );

    return {
      todays_activities: todaysActivities,
      summary,
    };
  }

  /**
   * Calculate progress status based on current time
   */
  private calculateProgressStatus(
    startTime: string,
    endTime: string,
  ): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    if (currentTime < startTime) {
      return 'NOT_STARTED';
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return 'IN_PROGRESS';
    } else {
      return 'COMPLETED';
    }
  }
}
