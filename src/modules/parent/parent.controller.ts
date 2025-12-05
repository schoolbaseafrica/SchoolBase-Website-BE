import { PaginationMeta } from '@hng-sdk/orm';
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import {
  ApiParentTags,
  ApiParentBearerAuth,
  ApiCreateParent,
  ApiGetParent,
  ApiListParents,
  ApiUpdateParent,
  ApiDeleteParent,
  ApiLinkStudents,
  ApiGetLinkedStudents,
  ApiGetStudentSubjects,
  ApiGetMyStudents,
  ApiUnlinkStudent,
  ApiGetLinkedStudentProfileForParent,
} from './docs/parent.swagger';
import {
  CreateParentDto,
  LinkStudentsDto,
  ParentResponseDto,
  StudentSubjectResponseDto,
  UpdateParentDto,
  ParentStudentLinkResponseDto,
  StudentBasicDto,
  StudentProfileDto,
} from './dto';
import { ParentService, IUserPayload } from './parent.service';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiParentTags()
@ApiParentBearerAuth()
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // --- POST: CREATE PARENT (ADMIN ONLY) ---
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateParent()
  async create(@Body() createDto: CreateParentDto): Promise<{
    message: string;
    status_code: number;
    data: ParentResponseDto;
  }> {
    const data = await this.parentService.create(createDto);
    return {
      message: sysMsg.PARENT_CREATED,
      status_code: HttpStatus.CREATED,
      data,
    };
  }

  // --- GET: GET MY LINKED STUDENTS (PARENT ONLY) ---
  @Get('my-students')
  @Roles(UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiGetMyStudents()
  async getMyStudents(@Request() req): Promise<{
    message: string;
    status_code: number;
    data: StudentBasicDto[];
  }> {
    const parentId = req.user.parent_id;
    const data = await this.parentService.getLinkedStudents(parentId);
    return {
      message: sysMsg.PARENT_STUDENTS_FETCHED,
      status_code: HttpStatus.OK,
      data,
    };
  }

  // --- GET: GET SINGLE PARENT BY ID (ADMIN OR PARENT THEMSELVES) ---
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @ApiGetParent()
  async getParent(@Param('id') id: string): Promise<{
    message: string;
    status_code: number;
    data: ParentResponseDto;
  }> {
    const data = await this.parentService.findOne(id);
    return {
      message: sysMsg.PARENTS_FETCHED,
      status_code: HttpStatus.OK,
      data,
    };
  }

  // --- GET: LIST ALL PARENTS (ADMIN ONLY) ---
  @Get()
  @Roles(UserRole.ADMIN)
  @ApiListParents()
  async listParents(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ): Promise<{
    message: string;
    status_code: number;
    data: ParentResponseDto[];
    meta: Partial<PaginationMeta>; // Fixed: no more 'any'
  }> {
    const { data, paginationMeta } = await this.parentService.findAll({
      page,
      limit,
      search,
    });

    return {
      message: sysMsg.PARENTS_FETCHED,
      status_code: HttpStatus.OK,
      data,
      meta: paginationMeta,
    };
  }

  // --- PATCH: UPDATE PARENT (ADMIN ONLY) ---
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiUpdateParent()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateParentDto,
  ): Promise<{
    message: string;
    status_code: number;
    data: ParentResponseDto;
  }> {
    const data = await this.parentService.update(id, updateDto);
    return {
      message: sysMsg.PARENT_UPDATED,
      status_code: HttpStatus.OK,
      data,
    };
  }

  // --- DELETE: SOFT DELETE PARENT (ADMIN ONLY) ---
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiDeleteParent()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{
    message: string;
    status_code: number;
  }> {
    await this.parentService.remove(id);
    return {
      message: sysMsg.PARENT_DELETED,
      status_code: HttpStatus.OK,
    };
  }

  // --- GET: VIEW CHILD'S SUBJECTS AND TEACHERS (PARENT OR ADMIN) ---
  @Get('children/:studentId/subjects')
  @Roles(UserRole.PARENT, UserRole.ADMIN)
  @ApiOperation({ summary: "View child's subjects and teachers" })
  @ApiGetStudentSubjects()
  async getStudentSubjects(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @CurrentUser() user: IUserPayload,
  ): Promise<{
    message: string;
    status_code: number;
    data: StudentSubjectResponseDto[];
  }> {
    const data = await this.parentService.getStudentSubjects(studentId, user);
    return {
      message: sysMsg.SUBJECTS_RETRIEVED,
      status_code: HttpStatus.OK,
      data,
    };
  }
  // --- POST: LINK STUDENTS TO PARENT (ADMIN ONLY) ---
  @Post(':parentId/link-students')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiLinkStudents()
  async linkStudents(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Body() linkDto: LinkStudentsDto,
  ): Promise<{
    message: string;
    status_code: number;
    data: ParentStudentLinkResponseDto;
  }> {
    const data = await this.parentService.linkStudentsToParent(
      parentId,
      linkDto,
    );
    return {
      message: sysMsg.STUDENTS_LINKED_TO_PARENT,
      status_code: HttpStatus.CREATED,
      data,
    };
  }

  // --- GET: GET A SINGLE LINKED STUDENT PROFILE ---
  @Get('/:parentId/link-students/:studentId')
  @Roles(UserRole.ADMIN, UserRole.PARENT)
  @HttpCode(HttpStatus.OK)
  @ApiGetLinkedStudentProfileForParent()
  async getLinkedStudentProfileForParent(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<{
    message: string;
    status_code: number;
    data: StudentProfileDto;
  }> {
    const data = await this.parentService.getLinkedStudentProfileForParent(
      parentId,
      studentId,
    );
    return {
      message: sysMsg.PARENT_STUDENT_PROFILE_FETCHED,
      status_code: HttpStatus.OK,
      data,
    };
  }

  // --- DELETE: UNLINK STUDENT FROM PARENT (ADMIN ONLY) ---
  @Delete(':parentId/students/:studentId')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiUnlinkStudent()
  async unlinkStudent(
    @Param('parentId', ParseUUIDPipe) parentId: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ): Promise<{
    message: string;
    status_code: number;
  }> {
    await this.parentService.unlinkStudentFromParent(parentId, studentId);
    return {
      message: sysMsg.STUDENT_UNLINKED_FROM_PARENT,
      status_code: HttpStatus.OK,
    };
  }

  // --- GET: GET LINKED STUDENTS FOR PARENT (ADMIN ONLY) ---
  @Get('admin/:parentId/students')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiGetLinkedStudents()
  async getLinkedStudents(
    @Param('parentId', ParseUUIDPipe) parentId: string,
  ): Promise<{
    message: string;
    status_code: number;
    data: StudentBasicDto[];
  }> {
    const data = await this.parentService.getLinkedStudents(parentId);
    return {
      message: sysMsg.PARENT_STUDENTS_FETCHED,
      status_code: HttpStatus.OK,
      data,
    };
  }
}
