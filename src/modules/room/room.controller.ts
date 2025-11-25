import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../shared/enums';

import { RoomSwagger } from './docs/room-swagger';
import { CreateRoomDTO } from './dto/create-room-dto';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation(RoomSwagger.decorators.create.operation)
  @ApiBody(RoomSwagger.decorators.create.body)
  @ApiResponse(RoomSwagger.decorators.create.response)
  @ApiResponse(RoomSwagger.decorators.create.errorResponses[0])
  @ApiResponse(RoomSwagger.decorators.create.errorResponses[1])
  async create(@Body() createRoomDto: CreateRoomDTO) {
    return this.roomService.create(createRoomDto);
  }
}
