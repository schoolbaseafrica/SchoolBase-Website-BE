import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
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
  ApiUpdateRoom,
} from '../docs/room-swagger';
import { CreateRoomDTO } from '../dto/create-room-dto';
import { FilterRoomDTO } from '../dto/filter-room-dto';
import { UpdateRoomDTO } from '../dto/update-room-dto';
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
  @ApiFindAllRooms()
  async findAll(@Query() query: FilterRoomDTO) {
    return this.roomService.findAll(query);
  }

  @Patch(':id')
  @ApiUpdateRoom()
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDTO) {
    return this.roomService.update(id, updateRoomDto);
  }

  @Get(':id')
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
