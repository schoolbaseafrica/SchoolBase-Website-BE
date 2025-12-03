import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  GenerateResultDto,
  ListResultsQueryDto,
  ResultResponseDto,
} from '../dto';
import { ResultService } from '../services/result.service';

interface IRequestWithUser extends Request {
  user: {
    id: string;
    userId: string;
    teacher_id?: string;
    student_id?: string;
    parent_id?: string;
    roles: UserRole[];
  };
}

@ApiTags('Results')
@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultController {
  constructor(private readonly resultService: ResultService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate results for students' })
  @ApiResponse({
    status: 201,
    description: 'Results generated successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async generateResults(@Body() generateDto: GenerateResultDto) {
    if (generateDto.student_id) {
      // Generate for single student
      return this.resultService.generateStudentResult(
        generateDto.student_id,
        generateDto.term_id,
        generateDto.academic_session_id,
      );
    } else if (generateDto.class_id) {
      // Generate for entire class
      return this.resultService.generateClassResults(
        generateDto.class_id,
        generateDto.term_id,
        generateDto.academic_session_id,
      );
    } else {
      throw new BadRequestException(
        'Either student_id or class_id must be provided',
      );
    }
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get results for a specific student' })
  @ApiResponse({
    status: 200,
    description: 'Student results retrieved successfully',
    type: [ResultResponseDto],
  })
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getStudentResults(
    @Req() req: IRequestWithUser,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Query() query: ListResultsQueryDto,
  ) {
    // Authorization check
    if (req.user.roles.includes(UserRole.STUDENT)) {
      if (req.user.student_id !== studentId) {
        throw new ForbiddenException('Unauthorized access to student results');
      }
    } else if (req.user.roles.includes(UserRole.PARENT)) {
      // TODO: Add parent-student relationship check
      // For now, allow if parent role
    }

    return this.resultService.getStudentResults(studentId, query);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get results for all students in a class' })
  @ApiResponse({
    status: 200,
    description: 'Class results retrieved successfully',
    type: [ResultResponseDto],
  })
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getClassResults(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('term_id', ParseUUIDPipe) termId: string,
    @Query('academic_session_id') academicSessionId?: string,
  ) {
    return this.resultService.getClassResults(
      classId,
      termId,
      academicSessionId,
    );
  }

  @Get(':resultId')
  @ApiOperation({ summary: 'Get a specific result by ID' })
  @ApiResponse({
    status: 200,
    description: 'Result retrieved successfully',
    type: ResultResponseDto,
  })
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  async getResultById(
    @Param('resultId', ParseUUIDPipe) resultId: string,
  ): Promise<ResultResponseDto> {
    return this.resultService.getResultById(resultId);
  }

  @Get()
  @ApiOperation({ summary: 'List all results with filters' })
  @ApiResponse({
    status: 200,
    description: 'Results retrieved successfully',
    type: [ResultResponseDto],
  })
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async listResults(@Query() query: ListResultsQueryDto) {
    return this.resultService.listResults(query);
  }
}
