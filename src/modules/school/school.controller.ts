import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';

import { installationApi } from './decorators/installation-api.decorator';
import { CreateInstallationDto } from './dto/create-installation.dto';
import { SchoolService } from './school.service';

interface IUploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('School')
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post('installation')
  @UseInterceptors(FileInterceptor('logo'))
  @installationApi()
  async processInstallation(
    @Body() createInstallationDto: CreateInstallationDto,
    @UploadedFile() logo?: IUploadedFile,
  ) {
    return this.schoolService.processInstallation(createInstallationDto, logo);
  }

  @Get()
  findAll() {
    return this.schoolService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schoolService.findOne(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schoolService.remove(+id);
  }
}
