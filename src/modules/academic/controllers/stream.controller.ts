import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import  * as sysMsg from '../../../constants/system.messages';
import { StreamResponseDto } from '../dto/stream-response.dto';
import { StreamService } from '../services/stream.service';

export interface IBaseResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

@ApiTags('Academic - Streams')
@Controller('streams')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get('class/:classId')
  @ApiOperation({ summary: 'Get all streams for a specific class' })
  @ApiParam({
    name: 'classId',
    type: 'string',
    description: 'UUID of the class',
    example: '123e4567-e89b-12d3-a456-426614174000',
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
