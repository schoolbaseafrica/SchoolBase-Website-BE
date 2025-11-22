import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';

import { pictureUploadConfig } from '../../config/multer.config';
import * as sysMsg from '../../constants/system.messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UploadPictureResponseDto } from './dto';
import { UploadService } from './upload.service';

interface IRequestWithUser extends Request {
  user?: {
    userId?: string;
    email?: string;
    roles?: string[];
  };
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiTags('Upload')
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('picture')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', pictureUploadConfig))
  @ApiOperation({
    summary: 'Upload a picture to Cloudinary',
    description:
      'Uploads an image file (JPEG, PNG, WebP) to Cloudinary and returns the URL. Maximum file size is 5MB. Only authenticated users can access this endpoint.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (JPEG, PNG, or WebP, max 5MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Picture uploaded successfully',
    type: UploadPictureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or file too large',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication required',
  })
  async uploadPicture(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: IRequestWithUser,
  ): Promise<{
    status_code: number;
    message: string;
    data: UploadPictureResponseDto;
  }> {
    const userId = req.user?.userId;

    const result = await this.uploadService.uploadPicture(file, userId);

    return {
      status_code: HttpStatus.OK,
      message: sysMsg.IMAGE_UPLOAD_SUCCESS,
      data: result,
    };
  }
}
