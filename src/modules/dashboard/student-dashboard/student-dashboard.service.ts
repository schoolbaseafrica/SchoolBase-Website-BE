import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { StudentModelAction } from '../../student/model-actions/student-actions';
import { TimetableService } from '../../timetable/timetable.service';
import { UserService } from '../../user/user.service';

import {
  StudentDashboardDataDto,
  TimetableItemDto,
  LatestResultDto,
  AnnouncementDto,
} from './dto/student-dashboard-response.dto';

@Injectable()
export class StudentDashboardService {
  private readonly logger: Logger;

  constructor(
    private readonly userService: UserService,
    private readonly studentModelAction: StudentModelAction,
    private readonly timetableService: TimetableService,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: StudentDashboardService.name });
  }

  async loadStudentDashboard(userId: string): Promise<StudentDashboardDataDto> {
    this.logger.info(`Loading dashboard for student user ${userId}`);

    // Fetch student record
    const { payload: students } = await this.studentModelAction.list({
      filterRecordOptions: { user: { id: userId } },
      relations: { stream: true, user: true },
    });

    if (!students || students.length === 0) {
      this.logger.warn(`Student record not found for user ${userId}`);
      throw new NotFoundException('Student record not found');
    }

    const student = students[0];

    // Fetch all dashboard data
    const [todaysTimetable, latestResults, announcements] = await Promise.all([
      this.getTodaysTimetable(student.id),
      this.getLatestResults(student.id),
      this.getAnnouncements(),
    ]);

    // Build metadata
    const metadata = {
      class: student.stream?.name || 'Not Assigned',
      enrollment_status: student ? 'Active' : 'Pending',
      total_subjects: todaysTimetable.length > 0 ? todaysTimetable.length : 0,
    };

    this.logger.info(
      `Dashboard loaded successfully for student ${student.id} with ${todaysTimetable.length} classes, ${latestResults.length} results, ${announcements.length} announcements`,
    );

    return {
      todays_timetable: todaysTimetable,
      latest_results: latestResults,
      announcements: announcements,
      metadata,
    };
  }

  /**
   * Fetches today's timetable for a student
   * Uses TimetableService to get the class timetable and filters for today
   */
  private async getTodaysTimetable(
    studentId: string,
  ): Promise<TimetableItemDto[]> {
    this.logger.info(`Fetching today's timetable for student ${studentId}`);

    // Get student with stream (class) information
    const { payload: students } = await this.studentModelAction.list({
      filterRecordOptions: { id: studentId },
      relations: { stream: { class: true } },
    });

    if (!students || students.length === 0 || !students[0].stream?.class) {
      this.logger.warn(`Student ${studentId} has no assigned class`);
      return [];
    }

    const classId = students[0].stream.class.id;

    // Get timetable for the class
    const timetable = await this.timetableService.findByClass(classId);

    if (
      !timetable ||
      !timetable.schedules ||
      timetable.schedules.length === 0
    ) {
      this.logger.info(`No timetable found for class ${classId}`);
      return [];
    }

    // Get today's day of week
    const today = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toUpperCase();

    // Filter schedules for today and map to TimetableItemDto
    const todaysSchedules = timetable.schedules
      .filter((schedule) => schedule.day === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((schedule) => ({
        id: schedule.id,
        subject_name: schedule.subject?.name || 'Break',
        teacher_name: schedule.teacher
          ? `${schedule.teacher.title || ''} ${schedule.teacher.first_name} ${schedule.teacher.last_name}`.trim()
          : null,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room
          ? {
              id: schedule.room.id,
              name: schedule.room.name,
              capacity: schedule.room.capacity,
            }
          : null,
        period_type: schedule.period_type,
      }));

    this.logger.info(
      `Found ${todaysSchedules.length} classes for today for student ${studentId}`,
    );
    return todaysSchedules;
  }

  /**
   * Fetches the latest 5 results for a student
   * Dependencies: ResultsService, SubjectService
   * Note: This is a placeholder implementation - requires external services
   */
  private async getLatestResults(
    studentId: string,
  ): Promise<LatestResultDto[]> {
    this.logger.info(`Fetching latest results for student ${studentId}`);

    // TODO: Implement when ResultsService is available
    // const results = await this.resultModelAction.list({
    //   filterRecordOptions: { student_id: studentId },
    //   relations: { subject: true, term: true },
    //   order: { recorded_at: 'DESC' },
    //   paginationPayload: { page: 1, limit: 5 }
    // });
    //
    // return results.payload.map(result => ({
    //   id: result.id,
    //   subject_name: result.subject?.name || 'Unknown',
    //   score: result.score,
    //   grade: result.grade,
    //   remark: result.remark,
    //   term: result.term?.name || 'N/A',
    //   recorded_at: result.recorded_at
    // }));

    // Placeholder: Return empty array until service is available
    this.logger.warn(
      'ResultsService not yet available - returning empty results',
    );
    return [];
  }

  /**
   * Fetches recent announcements for students
   * Dependencies: AnnouncementsService
   * Note: This is a placeholder implementation - requires external services
   */
  private async getAnnouncements(): Promise<AnnouncementDto[]> {
    this.logger.info('Fetching student announcements');

    // TODO: Implement when AnnouncementsService is available
    // const now = new Date();
    // const announcements = await this.announcementModelAction.list({
    //   filterRecordOptions: {
    //     audience: ArrayContains(['students']),
    //     is_active: true
    //   },
    //   order: { published_at: 'DESC' },
    //   paginationPayload: { page: 1, limit: 5 }
    // });
    //
    // // Filter out expired announcements
    // const validAnnouncements = announcements.payload.filter(
    //   a => !a.expires_at || new Date(a.expires_at) > now
    // );
    //
    // return validAnnouncements.map(announcement => ({
    //   id: announcement.id,
    //   title: announcement.title,
    //   content: announcement.content,
    //   priority: announcement.priority,
    //   published_at: announcement.published_at,
    //   expires_at: announcement.expires_at
    // }));

    // Placeholder: Return empty array until service is available
    this.logger.warn(
      'AnnouncementsService not yet available - returning empty announcements',
    );
    return [];
  }
}
