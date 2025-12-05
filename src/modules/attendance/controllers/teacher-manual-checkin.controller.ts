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
import { UserRole } from 'src/modules/shared/enums';

import { IRequestWithUser } from '../../../common/types/request-with-user.interface';
import {
  ApiCreateTeacherManualCheckinDocs,
  ApiListTeacherCheckinRequestsDocs,
  ApiReviewTeacherManualCheckinDocs,
  ApiTeacherCheckoutDocs,
} from '../docs';
import {
  CreateTeacherManualCheckinDto,
  ListTeacherCheckinRequestsQueryDto,
  ReviewTeacherManualCheckinDto,
} from '../dto';
import { CreateTeacherCheckoutDto } from '../dto/teacher-manual-checkout.dto';
import { TeacherManualCheckinService } from '../services';

@Controller('attendance/teacher/')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Attendance')
@ApiBearerAuth()
export class TeacherManualCheckinController {
  constructor(
    private readonly teacherManualCheckinService: TeacherManualCheckinService,
  ) {}

  // --- TEACHER MANUAL CHECKIN ---
  @Post('manual-checkin')
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
  @Patch('manual-checkin/:id/review')
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
  @Get('manual-checkin/requests')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiListTeacherCheckinRequestsDocs()
  async listTeacherCheckinRequests(
    @Query() query: ListTeacherCheckinRequestsQueryDto,
  ) {
    return this.teacherManualCheckinService.listTeacherCheckinRequests(query);
  }

  // --- TEACHER CHECKOUT ---
  @Post('manual-checkout')
  @Roles(UserRole.TEACHER)
  @HttpCode(HttpStatus.OK)
  @ApiTeacherCheckoutDocs()
  async teacherCheckout(
    @Req() req: IRequestWithUser,
    @Body() dto: CreateTeacherCheckoutDto,
  ) {
    return this.teacherManualCheckinService.teacherCheckout(req, dto);
  }
}
