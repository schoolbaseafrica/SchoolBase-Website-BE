import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import { GenerateResultDto, ResultResponseDto } from '../dto';
import { ResultService } from '../services/result.service';

@ApiTags('Results')
@ApiBearerAuth()
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
    return this.resultService.generateClassResults(
      generateDto.class_id,
      generateDto.term_id,
      generateDto.academic_session_id,
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
}
