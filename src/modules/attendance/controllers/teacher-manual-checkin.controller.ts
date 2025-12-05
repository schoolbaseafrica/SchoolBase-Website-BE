import {
  Body,
  Controller,
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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { IRequestWithUser } from '../../../common/types/request-with-user.interface';
import { UserRole } from 'src/modules/shared/enums';

import {
  ApiCreateTeacherManualCheckinDocs,
  ApiListTeacherCheckinRequestsDocs,
  ApiReviewTeacherManualCheckinDocs,
} from '../docs';
import {
  CreateTeacherManualCheckinDto,
  ListTeacherCheckinRequestsQueryDto,
  ReviewTeacherManualCheckinDto,
} from '../dto';
import { TeacherManualCheckinService } from '../services';

@Controller('attendance/teacher/manual-checkin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Attendance')
@ApiBearerAuth()
export class TeacherManualCheckinController {
  constructor(
    private readonly teacherManualCheckinService: TeacherManualCheckinService,
  ) {}

  // --- TEACHER MANUAL CHECKIN ---
  @Post()
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateTeacherManualCheckinDocs()
  async createTeacherManualCheckin(
    @Req() req: IRequestWithUser,
    @Body() dto: CreateTeacherManualCheckinDto,
  ) {
    return this.teacherManualCheckinService.create(req, dto);
  }

  // --- REVIEW TEACHER MANUAL CHECKIN ---
  @Patch(':id/review')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiReviewTeacherManualCheckinDocs()
  async reviewTeacherManualCheckin(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: IRequestWithUser,
    @Body() dto: ReviewTeacherManualCheckinDto,
  ) {
    return this.teacherManualCheckinService.reviewTeacherCheckinRequest(
      req,
      id,
      dto,
    );
  }

  // --- ALL CHECKIN REQUESTS ---
  @Get('requests')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiListTeacherCheckinRequestsDocs()
  async listTeacherCheckinRequests(
    @Query() query: ListTeacherCheckinRequestsQueryDto,
  ) {
    return this.teacherManualCheckinService.listTeacherCheckinRequests(query);
  }
}
