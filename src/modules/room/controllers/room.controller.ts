import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../shared/enums';
import {
  ApiCreateRoom,
  ApiDeleteRoom,
  ApiFindAllRooms,
  ApiFindOneRoom,
} from '../docs/room-swagger';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { RoomService } from '../services/room.service';

@Controller('rooms')
@ApiTags('Rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreateRoom()
  async create(@Body() createRoomDto: CreateRoomDTO) {
    return this.roomService.create(createRoomDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiFindAllRooms()
  async findAll() {
    return this.roomService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiFindOneRoom()
  async findOne(@Param('id') id: string) {
    return this.roomService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDeleteRoom()
  async remove(@Param('id') id: string) {
    return this.roomService.remove(id);
  }
}
