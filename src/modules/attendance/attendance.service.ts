import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import {
  ATTENDANCE_MARKED_SUCCESSFULLY,
  ATTENDANCE_UPDATED_SUCCESSFULLY,
  ATTENDANCE_RECORDS_RETRIEVED,
  ATTENDANCE_NOT_FOUND,
  ATTENDANCE_FUTURE_DATE_NOT_ALLOWED,
  TEACHER_NOT_ASSIGNED_TO_SCHEDULE,
  SCHEDULE_NOT_FOUND,
  NO_ACTIVE_SESSION,
  CLASS_NOT_FOUND,
} from 'src/constants/system.messages';

import {
  SessionStatus,
  AcademicSession,
} from '../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../academic-session/model-actions/academic-session-actions';
import { ClassStudent } from '../class/entities/class-student.entity';
import { Schedule } from '../timetable/entities/schedule.entity';

import {
  BulkMarkAttendanceDto,
  UpdateAttendanceDto,
  GetAttendanceQueryDto,
  AttendanceResponseDto,
} from './dto';
import { Attendance } from './entities';
import { AttendanceModelAction } from './model-actions';

export interface IPaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

@Injectable()
export class AttendanceService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly attendanceModelAction: AttendanceModelAction,
    private readonly academicSessionModelAction: AcademicSessionModelAction,
    private readonly dataSource: DataSource,
  ) {
    this.logger = baseLogger.child({ context: AttendanceService.name });
  }

  /**
   * Get the currently active academic session
   */
  private async getActiveSession(): Promise<AcademicSession> {
    const { payload } = await this.academicSessionModelAction.list({
      filterRecordOptions: { status: SessionStatus.ACTIVE },
    });
    if (!payload.length) throw new NotFoundException(NO_ACTIVE_SESSION);
    if (payload.length > 1)
      throw new ConflictException('Multiple active sessions found');
    return payload[0];
  }

  /**
   * Bulk mark attendance for a schedule/period on a specific date
   * Teacher marks attendance for multiple students at once
   */
  async markAttendance(
    teacherId: string,
    dto: BulkMarkAttendanceDto,
  ): Promise<{
    message: string;
    status_code: number;
    data: {
      marked: number;
      updated: number;
      total: number;
    };
  }> {
    const { schedule_id, date, attendance_records } = dto;

    // Validate date is not in the future
    const attendanceDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (attendanceDate > today) {
      throw new BadRequestException(ATTENDANCE_FUTURE_DATE_NOT_ALLOWED);
    }

    // Get active session
    const activeSession = await this.getActiveSession();

    let markedCount = 0;
    let updatedCount = 0;

    await this.dataSource.transaction(async (manager) => {
      // Verify schedule exists and teacher is assigned to it
      const schedule = await manager.findOne(Schedule, {
        where: { id: schedule_id },
        relations: ['timetable', 'timetable.class'],
      });

      if (!schedule) {
        throw new NotFoundException(SCHEDULE_NOT_FOUND);
      }

      if (schedule.teacher_id !== teacherId) {
        throw new ForbiddenException(TEACHER_NOT_ASSIGNED_TO_SCHEDULE);
      }

      const classId = schedule.timetable?.class?.id;
      if (!classId) {
        throw new NotFoundException(CLASS_NOT_FOUND);
      }

      for (const record of attendance_records) {
        const { student_id, status, notes } = record;

        // Verify student is enrolled in this class
        const enrollment = await manager.findOne(ClassStudent, {
          where: {
            student: { id: student_id },
            class: { id: classId },
            is_active: true,
          },
          relations: ['student', 'class'],
        });

        if (!enrollment) {
          this.logger.warn(
            `Student ${student_id} is not enrolled in class ${classId}, skipping`,
          );
          continue;
        }

        // Check if attendance already exists
        const existingAttendance = await manager.findOne(Attendance, {
          where: {
            student_id,
            schedule_id,
            date: attendanceDate,
          },
        });

        if (existingAttendance) {
          // Update existing attendance
          await manager.update(
            Attendance,
            { id: existingAttendance.id },
            {
              status,
              notes: notes || existingAttendance.notes,
              marked_by: teacherId,
              marked_at: new Date(),
            },
          );
          updatedCount++;
        } else {
          // Create new attendance record
          await this.attendanceModelAction.create({
            createPayload: {
              schedule_id,
              student_id,
              session_id: activeSession.id,
              date: attendanceDate,
              status,
              marked_by: teacherId,
              marked_at: new Date(),
              notes,
            },
            transactionOptions: {
              useTransaction: true,
              transaction: manager,
            },
          });
          markedCount++;
        }
      }
    });

    this.logger.info(
      `Teacher ${teacherId} marked attendance for schedule ${schedule_id} on ${date}. Marked: ${markedCount}, Updated: ${updatedCount}`,
    );

    return {
      message: ATTENDANCE_MARKED_SUCCESSFULLY,
      status_code: 200,
      data: {
        marked: markedCount,
        updated: updatedCount,
        total: attendance_records.length,
      },
    };
  }

  /**
   * Get attendance records for a specific schedule and date
   */
  async getScheduleAttendance(
    scheduleId: string,
    date: string,
  ): Promise<{
    message: string;
    status_code: number;
    data: AttendanceResponseDto[];
  }> {
    const attendanceDate = new Date(date);

    const { payload: records } = await this.attendanceModelAction.list({
      filterRecordOptions: {
        schedule_id: scheduleId,
        date: attendanceDate,
      },
      order: { createdAt: 'DESC' },
    });

    return {
      message: ATTENDANCE_RECORDS_RETRIEVED,
      status_code: 200,
      data: records.map((record) => this.mapToResponseDto(record)),
    };
  }

  /**
   * Update a single attendance record
   */
  async updateAttendance(
    attendanceId: string,
    dto: UpdateAttendanceDto,
  ): Promise<{
    message: string;
    status_code: number;
    data: AttendanceResponseDto;
  }> {
    const attendance = await this.attendanceModelAction.get({
      identifierOptions: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException(ATTENDANCE_NOT_FOUND);
    }

    const updated = await this.attendanceModelAction.update({
      identifierOptions: { id: attendanceId },
      updatePayload: {
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        marked_at: new Date(),
      },
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info(`Attendance record ${attendanceId} updated`);

    return {
      message: ATTENDANCE_UPDATED_SUCCESSFULLY,
      status_code: 200,
      data: this.mapToResponseDto(updated),
    };
  }

  /**
   * Get student's own attendance history
   */
  async getStudentAttendance(
    studentId: string,
    query: GetAttendanceQueryDto,
  ): Promise<{
    message: string;
    status_code: number;
    data: AttendanceResponseDto[];
    meta: Partial<IPaginationMeta>;
  }> {
    const { start_date, end_date, status, page = 1, limit = 20 } = query;

    const filterOptions: Record<string, unknown> = { student_id: studentId };

    if (status) {
      filterOptions.status = status;
    }

    // For date ranges, we need to use raw query or simpler approach
    const { payload: records, paginationMeta } =
      await this.attendanceModelAction.list({
        filterRecordOptions: filterOptions,
        order: { date: 'DESC' },
        paginationPayload: { page, limit },
      });

    // Filter by date range in memory if needed (or use repository for complex queries)
    let filteredRecords = records;
    if (start_date || end_date) {
      const startDate = start_date ? new Date(start_date) : null;
      const endDate = end_date ? new Date(end_date) : null;

      filteredRecords = records.filter((record) => {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      });
    }

    return {
      message: ATTENDANCE_RECORDS_RETRIEVED,
      status_code: 200,
      data: filteredRecords.map((record) => this.mapToResponseDto(record)),
      meta: paginationMeta,
    };
  }

  /**
   * Get attendance records with filters (Admin/Teacher)
   */
  async getAttendanceRecords(query: GetAttendanceQueryDto): Promise<{
    message: string;
    status_code: number;
    data: AttendanceResponseDto[];
    meta: Partial<IPaginationMeta>;
  }> {
    const {
      schedule_id,
      student_id,
      start_date,
      end_date,
      status,
      page = 1,
      limit = 20,
    } = query;

    const filterOptions: Record<string, unknown> = {};

    if (schedule_id) filterOptions.schedule_id = schedule_id;
    if (student_id) filterOptions.student_id = student_id;
    if (status) filterOptions.status = status;

    const { payload: records, paginationMeta } =
      await this.attendanceModelAction.list({
        filterRecordOptions: filterOptions,
        order: { date: 'DESC', createdAt: 'DESC' },
        paginationPayload: { page, limit },
      });

    // Filter by date range in memory if needed
    let filteredRecords = records;
    if (start_date || end_date) {
      const startDate = start_date ? new Date(start_date) : null;
      const endDate = end_date ? new Date(end_date) : null;

      filteredRecords = records.filter((record) => {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < startDate) return false;
        if (endDate && recordDate > endDate) return false;
        return true;
      });
    }

    return {
      message: ATTENDANCE_RECORDS_RETRIEVED,
      status_code: 200,
      data: filteredRecords.map((record) => this.mapToResponseDto(record)),
      meta: paginationMeta,
    };
  }

  /**
   * Check if attendance is already marked for a schedule on a specific date
   */
  async isAttendanceMarked(
    scheduleId: string,
    date: string,
  ): Promise<{ is_marked: boolean; count: number }> {
    const attendanceDate = new Date(date);

    const { payload: records } = await this.attendanceModelAction.list({
      filterRecordOptions: {
        schedule_id: scheduleId,
        date: attendanceDate,
      },
    });

    return {
      is_marked: records.length > 0,
      count: records.length,
    };
  }

  /**
   * Map Attendance entity to response DTO
   */
  private mapToResponseDto(attendance: Attendance): AttendanceResponseDto {
    return {
      id: attendance.id,
      schedule_id: attendance.schedule_id,
      student_id: attendance.student_id,
      session_id: attendance.session_id,
      date: attendance.date,
      status: attendance.status,
      marked_by: attendance.marked_by,
      marked_at: attendance.marked_at,
      notes: attendance.notes,
      created_at: attendance.createdAt,
      updated_at: attendance.updatedAt,
    };
  }
}
