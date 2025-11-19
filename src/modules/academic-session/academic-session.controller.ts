import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import * as sysMsg from '../../constants/system.messages';

import { AcademicSessionService } from './academic-session.service';
import { AcademicSessionSwagger } from './docs/academic-session.swagger';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';

@ApiTags('Academic Session')
@Controller('academic-session')
export class AcademicSessionController {
  constructor(
    private readonly academicSessionService: AcademicSessionService,
  ) {}

  @Post()
  @ApiOperation(AcademicSessionSwagger.decorators.create.operation)
  @ApiBody(AcademicSessionSwagger.decorators.create.body)
  @ApiResponse(AcademicSessionSwagger.decorators.create.response)
  create(@Body() createAcademicSessionDto: CreateAcademicSessionDto) {
    return this.academicSessionService.create(createAcademicSessionDto);
  }

  @Get('active')
  @ApiOperation(AcademicSessionSwagger.decorators.activeSession.operation)
  @ApiResponse(AcademicSessionSwagger.decorators.activeSession.response)
  async activeSession() {
    const session = await this.academicSessionService.activeSessions();

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.ACTIVE_ACADEMIC_SESSION_SUCCESS,
      data: session,
    };
  }

  @Get()
  findAll() {
    return this.academicSessionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.academicSessionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.academicSessionService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.academicSessionService.remove(+id);
  }
}
