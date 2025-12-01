import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { UpdateTermDto } from './dto/update-term.dto';
import { TermService } from './term.service';

@ApiTags('Academic Term')
@Controller('academic-term')
export class TermController {
  constructor(private readonly termService: TermService) {}

  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all terms for a specific academic session' })
  @ApiParam({
    name: 'sessionId',
    type: String,
    description: 'The UUID of the academic session',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Terms retrieved successfully',
  })
  async findTermsBySession(@Param('sessionId') sessionId: string) {
    const terms = await this.termService.findTermsBySessionId(sessionId);
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.TERM_RETRIEVED,
      data: terms,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a term by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The UUID of the term',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Term retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Term not found',
  })
  async findOne(@Param('id') id: string) {
    const term = await this.termService.findOne(id);
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.TERM_RETRIEVED,
      data: term,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a term by ID (startDate and/or endDate)' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The UUID of the term',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateTermDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Term updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Term not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid date range',
  })
  async updateTerm(@Param('id') id: string, @Body() updateDto: UpdateTermDto) {
    const updatedTerm = await this.termService.updateTerm(id, updateDto);
    return {
      status_code: HttpStatus.OK,
      message: sysMsg.TERM_UPDATED,
      data: updatedTerm,
    };
  }
}
