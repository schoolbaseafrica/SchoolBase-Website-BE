import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import * as sysMsg from '../../constants/system.messages';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import {
  ApiParentTags,
  ApiParentBearerAuth,
  ApiCreateParent,
} from './docs/parent.swagger';
import { CreateParentDto, ParentResponseDto } from './dto';
import { ParentService } from './parent.service';

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
}
