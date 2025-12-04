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

import { IPaginationMeta } from 'src/common/types/base-response.interface';
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
} from '../../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { TermName } from '../../academic-term/entities/term.entity';
import { TermModelAction } from '../../academic-term/model-actions';
import { ClassStudent } from '../../class/entities/class-student.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Schedule } from '../../timetable/entities/schedule.entity';
import { DayOfWeek } from '../../timetable/enums/timetable.enums';
import {
  MarkAttendanceDto,
  UpdateAttendanceDto,
  GetScheduleAttendanceQueryDto,
  AttendanceResponseDto,
} from '../dto';
import { ScheduleBasedAttendance } from '../entities';
import { StudentDailyAttendance } from '../entities/student-daily-attendance.entity';
import {
  AttendanceStatus,
  DailyAttendanceStatus,
} from '../enums/attendance-status.enum';
import {
  AttendanceModelAction,
  StudentDailyAttendanceModelAction,
} from '../model-actions';

@Injectable()
export class AttendanceService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly attendanceModelAction: AttendanceModelAction,
    private readonly studentDailyAttendanceModelAction: StudentDailyAttendanceModelAction,
    private readonly academicSessionModelAction: AcademicSessionModelAction,
    private readonly termModelAction: TermModelAction,
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
   * Convert JavaScript day number (0-6) to DayOfWeek enum
   * JavaScript: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  private getDayOfWeekEnum(dayNumber: number): DayOfWeek {
    const dayMap = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    return dayMap[dayNumber];
  }

  /**
   * Bulk mark attendance for a schedule/period on a specific date
   * Teacher marks attendance for multiple students at once
   */
  async markAttendance(
    userId: string,
    dto: MarkAttendanceDto,
  ): Promise<{
    message: string;
    marked: number;
    updated: number;
    total: number;
  }> {
    const { schedule_id, date, attendance_records } = dto;

    // Validate date is not in the future
    const attendanceDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (attendanceDate > today) {
      throw new BadRequestException(ATTENDANCE_FUTURE_DATE_NOT_ALLOWED);
    }

    // Get teacher ID from user ID
    const teacher = await this.dataSource.manager.findOne(Teacher, {
      where: { user: { id: userId } },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher profile not found');
    }

    const teacherId = teacher.id;

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
        const existingAttendance = await manager.findOne(
          ScheduleBasedAttendance,
          {
            where: {
              student_id,
              schedule_id,
              date: attendanceDate,
            },
          },
        );

        if (existingAttendance) {
          // Update existing attendance using model action
          await this.attendanceModelAction.update({
            identifierOptions: { id: existingAttendance.id },
            updatePayload: {
              status: status as AttendanceStatus,
              notes: notes || existingAttendance.notes,
              marked_by: userId,
              marked_at: new Date(),
            },
            transactionOptions: {
              useTransaction: true,
              transaction: manager,
            },
          });
          updatedCount++;
        } else {
          // Create new attendance record
          await this.attendanceModelAction.create({
            createPayload: {
              schedule_id,
              student_id,
              session_id: activeSession.id,
              date: attendanceDate,
              status: status as AttendanceStatus,
              marked_by: userId,
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
      marked: markedCount,
      updated: updatedCount,
      total: attendance_records.length,
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
    data: AttendanceResponseDto;
  }> {
    const attendance = await this.attendanceModelAction.get({
      identifierOptions: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException(ATTENDANCE_NOT_FOUND);
    }

    // Build update payload with proper type handling
    const updatePayload: Partial<ScheduleBasedAttendance> = {
      marked_at: new Date(),
    };

    if (dto.status !== undefined) {
      updatePayload.status = dto.status as AttendanceStatus;
    }
    if (dto.notes !== undefined) {
      updatePayload.notes = dto.notes;
    }

    const updated = await this.attendanceModelAction.update({
      identifierOptions: { id: attendanceId },
      updatePayload,
      transactionOptions: {
        useTransaction: false,
      },
    });

    this.logger.info(`Attendance record ${attendanceId} updated`);

    return {
      message: ATTENDANCE_UPDATED_SUCCESSFULLY,
      data: this.mapToResponseDto(updated),
    };
  }

  /**
   * Update a single student daily attendance record
   */
  async updateStudentDailyAttendance(
    attendanceId: string,
    dto: UpdateAttendanceDto,
  ): Promise<{
    message: string;
  }> {
    const attendance = await this.studentDailyAttendanceModelAction.get({
      identifierOptions: { id: attendanceId },
    });

    if (!attendance) {
      throw new NotFoundException(ATTENDANCE_NOT_FOUND);
    }

    // Build update payload
    const updateData: Partial<StudentDailyAttendance> = {
      marked_at: new Date(),
    };

    if (dto.status !== undefined) {
      updateData.status = dto.status as DailyAttendanceStatus;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }
    if (dto.check_in_time !== undefined) {
      updateData.check_in_time = new Date(`1970-01-01T${dto.check_in_time}`);
    }
    if (dto.check_out_time !== undefined) {
      updateData.check_out_time = new Date(`1970-01-01T${dto.check_out_time}`);
    }

    await this.studentDailyAttendanceModelAction.update({
      identifierOptions: { id: attendanceId },
      updatePayload: updateData,
      transactionOptions: { useTransaction: false },
    });

    this.logger.info(`Student daily attendance record ${attendanceId} updated`);

    return {
      message: ATTENDANCE_UPDATED_SUCCESSFULLY,
    };
  }

  /**
   * Get student's own attendance history
   */
  async getStudentAttendance(
    studentId: string,
    query: GetScheduleAttendanceQueryDto,
  ): Promise<{
    message: string;
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
      data: filteredRecords.map((record) => this.mapToResponseDto(record)),
      meta: paginationMeta,
    };
  }

  /**
   * Get attendance records with filters (Admin/Teacher)
   */
  async getAttendanceRecords(query: GetScheduleAttendanceQueryDto): Promise<{
    message: string;
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
   * Mark student daily attendance (morning register)
   * Class teacher marks overall daily presence for all students
   */
  async markStudentDailyAttendance(
    userId: string,
    dto: MarkAttendanceDto,
  ): Promise<{
    message: string;
    marked: number;
    updated: number;
    total: number;
  }> {
    const { class_id, date, attendance_records } = dto;

    // Validate date
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
      const markTime = new Date();

      for (const record of attendance_records) {
        const { student_id, status, notes } = record;

        // Check if student is enrolled in class
        const enrollment = await manager.findOne(ClassStudent, {
          where: {
            student: { id: student_id },
            class: { id: class_id },
            is_active: true,
          },
        });

        if (!enrollment) {
          throw new NotFoundException(
            `Student ${student_id} not enrolled in class ${class_id}`,
          );
        }

        // Check for existing record
        const existingRecord = await manager.findOne(StudentDailyAttendance, {
          where: {
            student_id,
            class_id,
            date: attendanceDate,
          },
        });

        if (existingRecord) {
          // Update existing record using model action
          await this.studentDailyAttendanceModelAction.update({
            identifierOptions: { id: existingRecord.id },
            updatePayload: {
              status: status as DailyAttendanceStatus,
              check_in_time: existingRecord.check_in_time || markTime,
              notes: notes || existingRecord.notes,
              marked_by: userId,
              marked_at: new Date(),
            },
            transactionOptions: {
              useTransaction: true,
              transaction: manager,
            },
          });
          updatedCount++;
        } else {
          // Create new record using model action - auto-set check_in_time
          await this.studentDailyAttendanceModelAction.create({
            createPayload: {
              student_id,
              class_id,
              session_id: activeSession.id,
              date: attendanceDate,
              status: status as DailyAttendanceStatus,
              check_in_time: markTime,
              notes,
              marked_by: userId,
              marked_at: new Date(),
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
      `User ${userId} marked daily attendance for class ${class_id} on ${date}. Marked: ${markedCount}, Updated: ${updatedCount}`,
    );

    return {
      message: 'Student daily attendance marked successfully',
      marked: markedCount,
      updated: updatedCount,
      total: attendance_records.length,
    };
  }

  /**
   * Get a single student's term attendance summary
   * Shows aggregate attendance data for the entire term/date range
   */
  async getStudentTermAttendanceSummary(
    studentId: string,
    sessionId: string,
    termName: TermName,
  ): Promise<{
    message: string;
    total_school_days: number;
    days_present: number;
    days_absent: number;
  }> {
    // Get the term to find start and end dates
    const term = await this.termModelAction.get({
      identifierOptions: {
        sessionId: sessionId,
        name: termName,
      },
    });

    if (!term) {
      throw new NotFoundException(
        `Term ${termName} not found for session ${sessionId}`,
      );
    }

    const startDate = new Date(term.startDate);
    const endDate = new Date(term.endDate);

    // Get all daily attendance records for this student in the term
    const { payload: attendanceRecords } =
      await this.studentDailyAttendanceModelAction.list({
        filterRecordOptions: {
          student_id: studentId,
          session_id: sessionId,
        },
      });

    // Filter by term date range
    const filteredRecords = attendanceRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Calculate total school days by counting weekdays between term dates
    let totalSchoolDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Count only weekdays (Monday=1 to Friday=5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        totalSchoolDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate days present and absent
    let daysPresent = 0;
    let daysAbsent = 0;

    filteredRecords.forEach((record) => {
      switch (record.status) {
        case DailyAttendanceStatus.PRESENT:
        case DailyAttendanceStatus.LATE: // Count late as present
          daysPresent++;
          break;
        case DailyAttendanceStatus.ABSENT:
          daysAbsent++;
          break;
        case DailyAttendanceStatus.EXCUSED:
        case DailyAttendanceStatus.HALF_DAY:
          // Don't count excused or half day in either category
          break;
      }
    });

    return {
      message: ATTENDANCE_RECORDS_RETRIEVED,
      total_school_days: totalSchoolDays,
      days_present: daysPresent,
      days_absent: daysAbsent,
    };
  }

  /**
   * Get daily attendance summary for an entire class
   * Shows each student's attendance across all periods for a specific date
   */
  /**
   * Get total daily attendance for a class on a specific date
   * Returns student daily attendance records (check-in/check-out based)
   */
  async getClassDailyAttendance(
    classId: string,
    date: string,
  ): Promise<{
    message: string;
    class_id: string;
    date: string;
    students: Array<{
      student_id: string;
      first_name: string;
      middle_name?: string;
      last_name: string;
      attendance_id?: string;
      status?: string;
      check_in_time?: string;
      check_out_time?: string;
      notes?: string;
    }>;
    summary: {
      total_students: number;
      present_count: number;
      absent_count: number;
      late_count: number;
      excused_count: number;
      half_day_count: number;
      not_marked_count: number;
    };
  }> {
    // Get all students enrolled in the class
    const enrolledStudents = await this.dataSource.manager.find(ClassStudent, {
      where: {
        class: { id: classId },
        is_active: true,
      },
      relations: ['student', 'student.user'],
    });

    if (enrolledStudents.length === 0) {
      throw new NotFoundException('No students enrolled in this class');
    }

    // Get all daily attendance records for this class on this date
    // Use date string directly for date-only comparison
    const attendanceRecords = await this.dataSource.manager
      .createQueryBuilder(StudentDailyAttendance, 'attendance')
      .where('attendance.class_id = :classId', { classId })
      .andWhere('attendance.date = :date', { date })
      .getMany();

    // Create a map of student attendance for quick lookup
    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.student_id, record]),
    );

    // Build student data with attendance information
    const students = enrolledStudents.map((enrollment) => {
      const attendance = attendanceMap.get(enrollment.student.id);

      return {
        student_id: enrollment.student.id,
        first_name: enrollment.student.user.first_name,
        middle_name: enrollment.student.user.middle_name,
        last_name: enrollment.student.user.last_name,
        attendance_id: attendance?.id,
        status: attendance?.status,
        check_in_time: attendance?.check_in_time
          ? attendance.check_in_time.toString()
          : undefined,
        check_out_time: attendance?.check_out_time
          ? attendance.check_out_time.toString()
          : undefined,
        notes: attendance?.notes,
      };
    });

    // Calculate summary statistics
    const presentCount = attendanceRecords.filter(
      (r) => r.status === DailyAttendanceStatus.PRESENT,
    ).length;
    const absentCount = attendanceRecords.filter(
      (r) => r.status === DailyAttendanceStatus.ABSENT,
    ).length;
    const lateCount = attendanceRecords.filter(
      (r) => r.status === DailyAttendanceStatus.LATE,
    ).length;
    const excusedCount = attendanceRecords.filter(
      (r) => r.status === DailyAttendanceStatus.EXCUSED,
    ).length;
    const halfDayCount = attendanceRecords.filter(
      (r) => r.status === DailyAttendanceStatus.HALF_DAY,
    ).length;
    const notMarkedCount = enrolledStudents.length - attendanceRecords.length;

    return {
      message: 'Class daily attendance retrieved successfully',
      class_id: classId,
      date,
      students,
      summary: {
        total_students: enrolledStudents.length,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        excused_count: excusedCount,
        half_day_count: halfDayCount,
        not_marked_count: notMarkedCount,
      },
    };
  }

  /**
   * Get term attendance summary for an entire class
   * Shows each student's total daily attendance across the term
   */
  async getClassTermAttendance(
    classId: string,
    sessionId: string,
    term: TermName,
  ): Promise<{
    message: string;
    class_id: string;
    session_id: string;
    term: string;
    start_date: string;
    end_date: string;
    students: Array<{
      student_id: string;
      first_name: string;
      middle_name?: string;
      last_name: string;
      total_school_days: number;
      days_present: number;
      days_absent: number;
      days_excused: number;
      attendance_details: Array<{
        date: string;
        status: string;
        was_late: boolean;
      }>;
    }>;
    summary: {
      total_students: number;
      total_school_days: number;
    };
  }> {
    // Get the term by session_id and term name
    const { payload: terms } = await this.termModelAction.list({
      filterRecordOptions: {
        sessionId: sessionId,
        name: term,
      },
    });

    if (!terms || terms.length === 0) {
      throw new NotFoundException(
        `Term '${term}' not found for the specified session`,
      );
    }

    const termData = terms[0];
    // startDate and endDate are already strings from the database
    const startDate =
      typeof termData.startDate === 'string'
        ? termData.startDate
        : termData.startDate.toISOString().split('T')[0];
    const endDate =
      typeof termData.endDate === 'string'
        ? termData.endDate
        : termData.endDate.toISOString().split('T')[0];

    // Get all students enrolled in the class
    const enrolledStudents = await this.dataSource.manager.find(ClassStudent, {
      where: {
        class: { id: classId },
        is_active: true,
      },
      relations: ['student', 'student.user'],
    });

    if (enrolledStudents.length === 0) {
      throw new NotFoundException('No students enrolled in this class');
    }

    // Get all daily attendance records for this class in the term
    const attendanceRecords = await this.dataSource.manager
      .createQueryBuilder(StudentDailyAttendance, 'attendance')
      .where('attendance.class_id = :classId', { classId })
      .andWhere('attendance.date >= :startDate', { startDate })
      .andWhere('attendance.date <= :endDate', { endDate })
      .getMany();

    // Get unique dates to calculate total school days
    // Handle both string and Date types for the date field
    const uniqueDates = [
      ...new Set(
        attendanceRecords.map((r) =>
          typeof r.date === 'string'
            ? r.date
            : r.date.toISOString().split('T')[0],
        ),
      ),
    ];
    const totalSchoolDays = uniqueDates.length;

    // Build student summaries
    const studentSummaries = enrolledStudents.map((enrollment) => {
      const studentRecords = attendanceRecords.filter(
        (r) => r.student_id === enrollment.student.id,
      );

      // PRESENT = student was on time
      const daysOnTime = studentRecords.filter(
        (r) => r.status === DailyAttendanceStatus.PRESENT,
      ).length;

      // LATE = student was present but came late (NOT absent)
      const daysPresentButLate = studentRecords.filter(
        (r) => r.status === DailyAttendanceStatus.LATE,
      ).length;

      // Total days present = on time + late (both mean student attended)
      const daysPresent = daysOnTime + daysPresentButLate;

      // ABSENT = student did not attend
      const daysAbsent = studentRecords.filter(
        (r) => r.status === DailyAttendanceStatus.ABSENT,
      ).length;

      // EXCUSED = student was absent but excused
      const daysExcused = studentRecords.filter(
        (r) => r.status === DailyAttendanceStatus.EXCUSED,
      ).length;

      // Build detailed attendance records array
      const attendanceDetails = studentRecords.map((record) => ({
        date:
          typeof record.date === 'string'
            ? record.date
            : record.date.toISOString().split('T')[0],
        status: record.status,
        was_late: record.status === DailyAttendanceStatus.LATE,
      }));

      return {
        student_id: enrollment.student.id,
        first_name: enrollment.student.user.first_name,
        middle_name: enrollment.student.user.middle_name,
        last_name: enrollment.student.user.last_name,
        total_school_days: totalSchoolDays,
        days_present: daysPresent,
        days_absent: daysAbsent,
        days_excused: daysExcused,
        attendance_details: attendanceDetails,
      };
    });

    return {
      message: 'Class term attendance retrieved successfully',
      class_id: classId,
      session_id: sessionId,
      term: term,
      start_date: startDate,
      end_date: endDate,
      students: studentSummaries,
      summary: {
        total_students: enrolledStudents.length,
        total_school_days: totalSchoolDays,
      },
    };
  }

  /**
   * Map Attendance entity to response DTO
   */
  private mapToResponseDto(
    attendance: ScheduleBasedAttendance,
  ): AttendanceResponseDto {
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
