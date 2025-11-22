import {
  Controller,
  Get,
  Param,
  Delete,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { CreateInstallationDto } from './dto/create-installation.dto';
import { SchoolService } from './school.service';

@ApiTags('School')
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Post('installation')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiOperation({ summary: 'Complete school installation setup' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Green Valley High School' },
        logo: { type: 'string', format: 'binary' },
        primary_color: { type: 'string', example: '#1E40AF' },
        secondary_color: { type: 'string', example: '#3B82F6' },
        accent_color: { type: 'string', example: '#60A5FA' },
      },
      required: ['name'],
    },
  })
  async processInstallation(
    @Body() createInstallationDto: CreateInstallationDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @UploadedFile() logo?: any,
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
