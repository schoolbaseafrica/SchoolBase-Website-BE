import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { FindOptionsWhere, DataSource } from 'typeorm';
import { Logger } from 'winston';

import { IPaginationMeta } from 'src/common/types/base-response.interface';
import { TeacherModelAction } from 'src/modules/teacher/model-actions/teacher-actions';

import { IRequestWithUser } from '../../../common/types/request-with-user.interface';
import * as sysMsg from '../../../constants/system.messages';
import {
  CreateTeacherManualCheckinDto,
  ListTeacherCheckinRequestsQueryDto,
  TeacherCheckinRequestResponseDto,
  TeacherManualCheckinResponseDto,
  ReviewTeacherManualCheckinDto,
  ReviewTeacherManualCheckinResponseDto,
  TeacherAttendanceTodaySummaryResponseDto,
} from '../dto';
import {
  CreateTeacherCheckoutDto,
  TeacherCheckoutResponseDto,
} from '../dto/teacher-manual-checkout.dto';
import { TeacherManualCheckin } from '../entities/teacher-manual-checkin.entity';
import {
  TeacherDailyAttendanceDecisionEnum,
  TeacherDailyAttendanceSourceEnum,
  TeacherDailyAttendanceStatusEnum,
} from '../enums';
import { TeacherManualCheckinStatusEnum } from '../enums/teacher-manual-checkin.enum';
import { TeacherManualCheckinModelAction } from '../model-actions';
import { TeacherDailyAttendanceModelAction } from '../model-actions/teacher-daily-attendance.action';

@Injectable()
export class TeacherManualCheckinService {
  private readonly logger: Logger;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
    private readonly teacherManualCheckinModelAction: TeacherManualCheckinModelAction,
    private readonly teacherDailyAttendanceModelAction: TeacherDailyAttendanceModelAction,
    private readonly teacherModelAction: TeacherModelAction,
    private readonly dataSource: DataSource,
  ) {
    this.logger = baseLogger.child({
      context: TeacherManualCheckinService.name,
    });
  }

  // --- CREATE TEACHER MANUAL CHECKIN ---
  async create(user: IRequestWithUser, dto: CreateTeacherManualCheckinDto) {
    // --- Validate teacher exists ---
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { user_id: user.user.userId },
    });
    if (!teacher) {
      this.logger.error(`Teacher not found for user: ${user.user.userId}`);
      throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
    }
    const teacherId = teacher.id;

    // --- Validate teacher is active ---
    if (!teacher.is_active) {
      this.logger.error(`Teacher is not active: ${teacherId}`);
      throw new BadRequestException(sysMsg.TEACHER_IS_NOT_ACTIVE);
    }

    // --- Validate date is not in the future ---
    const checkInDate = new Date(dto.date);
    if (checkInDate > new Date()) {
      this.logger.error(`Check in date is in the the future: ${dto.date}`);
      throw new BadRequestException(sysMsg.CHECK_IN_DATE_IS_IN_THE_FUTURE);
    }

    // --- Validate check in time is within school hours ---
    // todo: get from school settings later
    const schoolStartHour = 7; // 7:00 AM
    const schoolEndHour = 17; // 5:00 PM

    // Parse check_in_time string "HH:MM:SS" to get hour
    const [hours] = dto.check_in_time.split(':').map(Number);

    if (hours < schoolStartHour || hours >= schoolEndHour) {
      this.logger.error(
        `Check in time outside school hours: ${dto.check_in_time}`,
      );
      throw new BadRequestException(
        sysMsg.CHECK_IN_TIME_NOT_WITHIN_SCHOOL_HOURS,
      );
    }

    // --- validate teacher has no automated checkins for the same date ---
    //todo: I'd add this check when the automated checkin is implemented

    //--- validate not already checked in for the same date ---
    const existingCheckin = await this.teacherManualCheckinModelAction.get({
      identifierOptions: {
        teacher_id: teacherId,
        check_in_date: new Date(dto.date),
      },
    });
    if (existingCheckin) {
      this.logger.error(`Already checked in for the same date: ${dto.date}`);
      throw new BadRequestException(
        sysMsg.ALREADY_CHECKED_IN_FOR_THE_SAME_DATE,
      );
    }

    // --- Create teacher manual checkin ---

    const checkInTimestamp = new Date(`${dto.date}T${dto.check_in_time}`);
    const teacherManualCheckin =
      await this.teacherManualCheckinModelAction.create({
        createPayload: {
          teacher_id: teacherId,
          check_in_date: new Date(dto.date),
          check_in_time: checkInTimestamp,
          reason: dto.reason,
          submitted_at: new Date(),
          status: TeacherManualCheckinStatusEnum.PENDING,
        },
        transactionOptions: {
          useTransaction: false,
        },
      });

    return {
      message: sysMsg.TEACHER_MANUAL_CHECKIN_CREATED_SUCCESSFULLY,
      data: plainToInstance(
        TeacherManualCheckinResponseDto,
        teacherManualCheckin,
        {
          excludeExtraneousValues: true,
        },
      ),
    };
  }

  // --- LIST TEACHER CHECKIN REQUESTS (ADMIN ONLY) ---
  async listTeacherCheckinRequests(
    query: ListTeacherCheckinRequestsQueryDto,
  ): Promise<{
    message: string;
    data: TeacherCheckinRequestResponseDto[];
    meta: Partial<IPaginationMeta>;
  }> {
    const { page, limit, status, check_in_date } = query;

    const filterOptions: FindOptionsWhere<TeacherManualCheckin> = {};
    if (status) filterOptions.status = status;
    if (check_in_date) filterOptions.check_in_date = new Date(check_in_date);

    const checkinRequests = await this.teacherManualCheckinModelAction.list({
      filterRecordOptions: filterOptions,
      paginationPayload: { page, limit },
    });

    return {
      message: sysMsg.PENDING_CHECKIN_REQUESTS_FETCHED_SUCCESSFULLY,
      data: checkinRequests.payload.map((request) =>
        plainToInstance(TeacherCheckinRequestResponseDto, request, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: checkinRequests.paginationMeta,
    };
  }

  // --- REVIEW TEACHER CHECKIN REQUEST (ADMIN ONLY) ---
  async reviewTeacherCheckinRequest(
    admin: IRequestWithUser,
    id: string, // checkin request id
    dto: ReviewTeacherManualCheckinDto,
  ): Promise<{
    message: string;
    data: ReviewTeacherManualCheckinResponseDto;
  }> {
    //--- Get the check-in request ---
    const checkinRequest = await this.teacherManualCheckinModelAction.get({
      identifierOptions: { id },
    });

    if (!checkinRequest) {
      throw new NotFoundException(sysMsg.CHECKIN_REQUEST_NOT_FOUND);
    }

    //--- Validate status is PENDING ---
    if (checkinRequest.status !== TeacherManualCheckinStatusEnum.PENDING) {
      throw new BadRequestException(sysMsg.CHECKIN_REQUEST_ALREADY_PROCESSED);
    }

    //--- Validate teacher still exists ---
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { id: checkinRequest.teacher_id },
    });

    if (!teacher) {
      throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
    }

    let updatedRequest;
    await this.dataSource.transaction(async (manager) => {
      // If APPROVED, create attendance
      if (dto.decision === TeacherDailyAttendanceDecisionEnum.APPROVED) {
        //--- Check if attendance already exists for the same date ---
        const existingAttendance =
          await this.teacherDailyAttendanceModelAction.get({
            identifierOptions: {
              teacher_id: checkinRequest.teacher_id,
              date: checkinRequest.check_in_date,
            },
          });

        if (existingAttendance) {
          this.logger.error(
            `Attendance already marked for the same date: ${checkinRequest.check_in_date}`,
          );
          throw new ConflictException(
            sysMsg.ATTENDANCE_ALREADY_MARKED_FOR_DATE,
          );
        }

        //--- Determine attendance status based on check-in time ---
        const checkInHour = new Date(checkinRequest.check_in_time).getHours();
        //todo: get threshold from school settings later
        const lateThreshold = 9; // 9:00 AM
        const attendanceStatus =
          checkInHour >= lateThreshold
            ? TeacherDailyAttendanceStatusEnum.LATE
            : TeacherDailyAttendanceStatusEnum.PRESENT;

        //--- Create attendance record ---
        await this.teacherDailyAttendanceModelAction.create({
          createPayload: {
            teacher_id: checkinRequest.teacher_id,
            date: checkinRequest.check_in_date,
            check_in_time: checkinRequest.check_in_time,
            status: attendanceStatus,
            source: TeacherDailyAttendanceSourceEnum.MANUAL,
            marked_by: admin.user.userId,
            marked_at: new Date(),
            notes: dto.review_notes,
          },
          transactionOptions: { useTransaction: true, transaction: manager },
        });
      }

      // Update request (for BOTH approve and reject)
      updatedRequest = await this.teacherManualCheckinModelAction.update({
        identifierOptions: { id },
        updatePayload: {
          status:
            dto.decision === TeacherDailyAttendanceDecisionEnum.APPROVED
              ? TeacherManualCheckinStatusEnum.APPROVED
              : TeacherManualCheckinStatusEnum.REJECTED,
          reviewed_by: admin.user.userId,
          reviewed_at: new Date(),
          review_notes: dto.review_notes,
        },
        transactionOptions: { useTransaction: true, transaction: manager },
      });
    });
    return {
      message:
        dto.decision === TeacherDailyAttendanceDecisionEnum.APPROVED
          ? sysMsg.CHECKIN_REQUEST_APPROVED
          : sysMsg.CHECKIN_REQUEST_REJECTED,
      data: plainToInstance(
        ReviewTeacherManualCheckinResponseDto,
        updatedRequest,
        {
          excludeExtraneousValues: true,
        },
      ),
    };
  }

  // --- TEACHER CHECKOUT ---
  async teacherCheckout(
    user: IRequestWithUser,
    dto: CreateTeacherCheckoutDto,
  ): Promise<{
    message: string;
    data: TeacherCheckoutResponseDto;
  }> {
    // --- Validate teacher exists ---
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { user_id: user.user.userId },
    });

    if (!teacher) {
      throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
    }

    // --- Validate teacher is active ---
    if (!teacher.is_active) {
      throw new BadRequestException(sysMsg.TEACHER_IS_NOT_ACTIVE);
    }

    // --- Get today's date (server time) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Check if attendance record exists for today ---
    const attendance = await this.teacherDailyAttendanceModelAction.get({
      identifierOptions: {
        teacher_id: teacher.id,
        date: today,
      },
    });

    if (!attendance) {
      // No check-in for today — check if there's a pending manual request
      const pendingRequest = await this.teacherManualCheckinModelAction.get({
        identifierOptions: {
          teacher_id: teacher.id,
          check_in_date: today,
          status: TeacherManualCheckinStatusEnum.PENDING,
        },
      });

      if (pendingRequest) {
        throw new BadRequestException(sysMsg.CANNOT_CHECKOUT_PENDING_CHECKIN);
      }

      throw new BadRequestException(sysMsg.NO_CHECKIN_FOR_TODAY);
    }

    // --- Check if already checked out ---
    if (attendance.check_out_time) {
      throw new BadRequestException(sysMsg.ALREADY_CHECKED_OUT);
    }

    // --- Calculate checkout time and total hours ---
    const checkoutTime = new Date();
    const checkInTime = new Date(attendance.check_in_time);
    const totalHoursWorked =
      (checkoutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    const roundedHours = Math.round(totalHoursWorked * 100) / 100; // Round to 2 decimal places

    // --- Update attendance record ---
    const updatedAttendance =
      await this.teacherDailyAttendanceModelAction.update({
        identifierOptions: { id: attendance.id },
        updatePayload: {
          check_out_time: checkoutTime,
          total_hours: roundedHours,
          notes: dto.notes
            ? `${attendance.notes || ''} | Checkout: ${dto.notes}`
            : attendance.notes,
        },
        transactionOptions: { useTransaction: false },
      });

    return {
      message: sysMsg.TEACHER_CHECKOUT_SUCCESS,
      data: plainToInstance(TeacherCheckoutResponseDto, updatedAttendance, {
        excludeExtraneousValues: true,
      }),
    };
  }

  // --- GET TODAY'S ATTENDANCE SUMMARY ---
  async getTodayAttendanceSummary(user: IRequestWithUser): Promise<{
    message: string;
    data: TeacherAttendanceTodaySummaryResponseDto;
  }> {
    // --- Validate teacher exists ---
    const teacher = await this.teacherModelAction.get({
      identifierOptions: { user_id: user.user.userId },
    });

    if (!teacher) {
      throw new NotFoundException(sysMsg.TEACHER_NOT_FOUND);
    }
    // --- Validate teacher is active ---
    if (!teacher.is_active) {
      throw new BadRequestException(sysMsg.TEACHER_IS_NOT_ACTIVE);
    }

    // --- Get today's date (midnight) ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // --- Query attendance for today ---
    const attendance = await this.teacherDailyAttendanceModelAction.get({
      identifierOptions: {
        teacher_id: teacher.id,
        date: today,
      },
    });

    // --- Check for pending manual request ---
    const pendingRequest = await this.teacherManualCheckinModelAction.get({
      identifierOptions: {
        teacher_id: teacher.id,
        check_in_date: today,
        status: TeacherManualCheckinStatusEnum.PENDING,
      },
    });

    // --- Return attendance summary ---
    return {
      message: attendance
        ? sysMsg.ATTENDANCE_SUMMARY_FETCHED
        : sysMsg.NO_ATTENDANCE_FOR_TODAY,
      data: {
        date: today,
        status: attendance?.status ?? null,
        check_in_time: attendance?.check_in_time ?? null,
        check_out_time: attendance?.check_out_time ?? null,
        total_hours: attendance?.total_hours ?? null,
        source: attendance?.source ?? null,
        has_attendance: !!attendance,
        is_checked_out: !!attendance?.check_out_time,
        has_pending_request: !!pendingRequest,
      },
    };
  }
}
