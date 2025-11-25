import {
  applyDecorators,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { pictureUploadConfig } from '../../../config/multer.config';
import {
  ApiUploadTags,
  ApiUploadBearerAuth,
  ApiUploadPicture,
} from '../docs/upload.swagger';

/**
 * Decorators for Upload module
 */

/**
 * Controller-level decorators for Upload endpoints
 */
export const UploadControllerDocs = () =>
  applyDecorators(ApiUploadTags(), ApiUploadBearerAuth());

/**
 * Decorators for Upload Picture endpoint
 * Combines all decorators needed for the upload picture route
 */
export const UploadPictureDecorators = () =>
  applyDecorators(
    HttpCode(HttpStatus.OK),
    UseInterceptors(FileInterceptor('file', pictureUploadConfig)),
    ApiUploadPicture(),
  );
