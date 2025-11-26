import { applyDecorators } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

import { UploadPictureResponseDto } from '../dto';

/**
 * Swagger decorators for Upload endpoints
 */
export const ApiUploadTags = () => applyDecorators(ApiTags('Upload'));

export const ApiUploadBearerAuth = () => applyDecorators(ApiBearerAuth());

/**
 * Swagger decorators for Upload Picture endpoint
 */
export const ApiUploadPicture = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Upload a picture to Cloudinary',
      description:
        'Uploads an image file (JPEG, PNG, WebP) to Cloudinary and returns the URL. Maximum file size is 5MB. Only authenticated users can access this endpoint.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
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
    }),
    ApiResponse({
      status: 200,
      description: 'Picture uploaded successfully',
      type: UploadPictureResponseDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid file or file too large',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
    }),
  );
