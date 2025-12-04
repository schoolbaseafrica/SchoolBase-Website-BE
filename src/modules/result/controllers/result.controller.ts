import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { StudentModelAction } from 'src/modules/student/model-actions';

import { SkipWrap } from '../../../common/decorators/skip-wrap.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import { DocsGetClassResults } from '../docs/result.decorator';
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
@ApiBearerAuth()
@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultController {
  constructor(
    private readonly resultService: ResultService,
    private readonly studentModelAction: StudentModelAction,
  ) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate results for students' })
  @ApiResponse({
    status: 201,
    description: 'Results generated successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async generateResults(@Body() generateDto: GenerateResultDto) {
    return this.resultService.generateClassResults(
      generateDto.class_id,
      generateDto.term_id,
      generateDto.academic_session_id,
    );
  }

  @Get('class/:classId')
  @DocsGetClassResults()
  @SkipWrap()
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getClassResults(
    @Param('classId', ParseUUIDPipe) classId: string,
    @Query('term_id', ParseUUIDPipe) termId: string,
    @Query('academic_session_id', new ParseUUIDPipe({ optional: true }))
    academicSessionId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.resultService.getClassResults(
      classId,
      termId,
      academicSessionId,
      page,
      limit,
    );
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
      const student = await this.studentModelAction.get({
        identifierOptions: { id: studentId },
        relations: { parent: true },
      });

      if (!student || student.parent.id !== req.user.parent_id) {
        throw new ForbiddenException('Unauthorized access to student results');
      }
    }

    return this.resultService.getStudentResults(studentId, query);
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
}
