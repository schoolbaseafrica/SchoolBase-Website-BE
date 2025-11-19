import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  HttpCode,
  HttpStatus,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

import { ApiSuccessResponseDto } from '../../common/dto/response.dto';

import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({
    description: 'Validation failed (uuid is expected)',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiOkResponse({
    description: 'Account deleted successfully',
    type: ApiSuccessResponseDto,
  })
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}
