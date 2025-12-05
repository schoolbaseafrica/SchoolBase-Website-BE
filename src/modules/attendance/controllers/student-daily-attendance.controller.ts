import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { IRequestWithUser } from 'src/common/types/request.interface';

import * as sysMsg from '../../../constants/system.messages';
import { TermName } from '../../academic-term/entities/term.entity';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  ApiAttendanceBearerAuth,
  ApiAttendanceTags,
  ApiGetClassDailyAttendance,
  ApiGetClassTermAttendance,
  ApiGetStudentMonthlyAttendance,
  ApiGetStudentTermSummary,
  ApiMarkStudentDailyAttendance,
  ApiUpdateStudentDailyAttendance,
  apiParentGetChildMonthlyAttendance,
} from '../docs';
import {
  MarkStudentDailyAttendanceDto,
  UpdateStudentDailyAttendanceDto,
} from '../dto';
import { AttendanceService } from '../services/attendance.service';

@Controller('attendance/daily/student')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiAttendanceTags()
@ApiAttendanceBearerAuth()
export class StudentDailyAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // --- POST: MARK STUDENT DAILY ATTENDANCE (TEACHER/ADMIN) ---
  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiMarkStudentDailyAttendance()
  async markStudentDailyAttendance(
    @Req() req: IRequestWithUser,
    @Body() dto: MarkStudentDailyAttendanceDto,
  ) {
    return this.attendanceService.markStudentDailyAttendance(
      req.user.userId,
      dto,
    );
  }

  //PARENTS GET THEIR CHILD MONTHLY ATTENDANCE

  @Get('parent')
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  @apiParentGetChildMonthlyAttendance()
  async getParentChildMonthlyAttendance(
    @Query('registration_number') matricNumber: string,
  ) {
    return this.attendanceService.getParentChildMonthlyAttendance(matricNumber);
  }

  // --- GET: CLASS DAILY ATTENDANCE SUMMARY (TEACHER/ADMIN) ---
  @Get('class/:classId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiGetClassDailyAttendance()
  async getClassDailyAttendance(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('date') date?: string,
  ) {
    // Default to today if no date provided
    const targetDate = date || new Date().toISOString().split('T')[0];
    return this.attendanceService.getClassDailyAttendance(classId, targetDate);
  }

  // --- GET: CLASS TERM ATTENDANCE SUMMARY (TEACHER/ADMIN) ---
  @Get('class/:classId/term')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiGetClassTermAttendance()
  async getClassTermAttendance(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('session_id') sessionId: string,
    @Query('term') termKey: string,
  ) {
    // Convert enum key (e.g., "SECOND") to enum value (e.g., "Second term")
    const term = TermName[termKey as keyof typeof TermName];

    if (!term) {
      throw new BadRequestException(sysMsg.INVALID_TERM);
    }

    return this.attendanceService.getClassTermAttendance(
      classId,
      sessionId,
      term,
    );
  }

  // STUDENT MONTHLY ATTENDANCE (STUDENT/TEACHER/ADMIN) ---
  @Get(':studentId/monthly')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiGetStudentMonthlyAttendance()
  async getStudentMonthlyAttendance(
    @Req() req: IRequestWithUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    // Students can only view their own attendance
    if (req.user.role === UserRole.STUDENT && req.user.userId !== studentId) {
      throw new ForbiddenException(
        sysMsg.STUDENTS_CAN_ONLY_VIEW_OWN_ATTENDANCE,
      );
    }

    return this.attendanceService.getStudentMonthlyAttendance(studentId);
  }

  // --- GET: STUDENT TERM ATTENDANCE SUMMARY (STUDENT/TEACHER/ADMIN) ---
  @Get(':studentId/term-summary')
  @Roles(UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiGetStudentTermSummary()
  async getStudentTermAttendanceSummary(
    @Req() req: IRequestWithUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query('session_id') sessionId: string,
    @Query('term') term: TermName,
  ) {
    // Students can only view their own attendance summary
    if (req.user.role === UserRole.STUDENT && req.user.userId !== studentId) {
      throw new ForbiddenException(
        sysMsg.STUDENTS_CAN_ONLY_VIEW_OWN_ATTENDANCE,
      );
    }

    return this.attendanceService.getStudentTermAttendanceSummary(
      studentId,
      sessionId,
      term,
    );
  }

  // --- PATCH: UPDATE STUDENT DAILY ATTENDANCE (TEACHER/ADMIN) ---
  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateStudentDailyAttendance()
  async updateStudentDailyAttendance(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStudentDailyAttendanceDto,
  ) {
    return this.attendanceService.updateStudentDailyAttendance(id, dto);
  }

  //parent endpoints to view child attendance
}
