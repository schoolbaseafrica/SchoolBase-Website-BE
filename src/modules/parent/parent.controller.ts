import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { CreateParentDto, ParentResponseDto } from './dto';
import { ParentService } from './parent.service';

@Controller('parents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Parents')
@ApiBearerAuth()
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  // --- POST: CREATE PARENT (ADMIN ONLY) ---
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new parent (ADMIN only)' })
  @ApiBody({ type: CreateParentDto })
  @ApiResponse({
    status: 201,
    description: 'Parent created successfully',
    type: ParentResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
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
}
