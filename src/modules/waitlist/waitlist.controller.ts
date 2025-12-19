import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';

import { CreateWaitlistDto } from './dto/create-waitlist.dto';
import { WaitlistService } from './waitlist.service';

@ApiTags('Waitlist')
@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add user to waitlist' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully added to waitlist',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async create(@Body() createWaitlistDto: CreateWaitlistDto) {
    const waitlistEntry = await this.waitlistService.create(createWaitlistDto);

    return {
      status_code: HttpStatus.CREATED,
      message: sysMsg.WAITLIST_ADDED_SUCCESSFULLY,
      data: {
        id: waitlistEntry.id,
        firstName: waitlistEntry.firstName,
        lastName: waitlistEntry.lastName,
        email: waitlistEntry.email,
        createdAt: waitlistEntry.createdAt,
      },
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all waitlist entries' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Waitlist entries retrieved successfully',
  })
  async findAll() {
    const entries = await this.waitlistService.findAll();

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.WAITLIST_RETRIEVED_SUCCESSFULLY,
      data: entries.map((entry) => ({
        id: entry.id,
        firstName: entry.firstName,
        lastName: entry.lastName,
        email: entry.email,
        createdAt: entry.createdAt,
      })),
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get specific waitlist entry' })
  async findOne(@Param('id') id: string) {
    const entry = await this.waitlistService.findOne(id);

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.OPERATION_SUCCESSFUL,
      data: {
        id: entry.id,
        firstName: entry.firstName,
        lastName: entry.lastName,
        email: entry.email,
        createdAt: entry.createdAt,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove entry from waitlist' })
  async remove(@Param('id') id: string) {
    await this.waitlistService.remove(id);

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.OPERATION_SUCCESSFUL,
      data: null,
    };
  }
}
