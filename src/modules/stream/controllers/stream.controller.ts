import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import * as sysMsg from '../../../constants/system.messages';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { UserRole } from '../../user/entities/user.entity';
import { StreamResponseDto } from '../dto/stream-response.dto';
import { StreamService } from '../services/stream.service';

export interface IBaseResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

@ApiTags('Stream')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('class/:classId')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @ApiOperation({ summary: 'Get all streams for a specific class' })
  @ApiParam({
    name: 'classId',
    type: 'string',
    description: 'UUID of the class',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: sysMsg.STREAMS_RETRIEVED,
    type: [StreamResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: sysMsg.CLASS_NOT_FOUND,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getStreamsByClass(
    @Param('classId', new ParseUUIDPipe()) classId: string,
  ): Promise<IBaseResponse<StreamResponseDto[]>> {
    const streams = await this.streamService.getStreamsByClass(classId);

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.STREAMS_RETRIEVED,
      data: streams,
    };
  }
}
