import { PaginationMeta } from '@hng-sdk/orm';
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
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
  ApiGetParent,
  ApiListParents,
  ApiUpdateParent,
} from './docs/parent.swagger';
import { CreateParentDto, ParentResponseDto, UpdateParentDto } from './dto';
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
}
