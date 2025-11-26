import { Injectable, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { IMulterFile } from '../../common/types/multer.types';

import { UploadPictureResponseDto } from './dto';
import { CloudinaryService } from './services/cloudinary.service';

@Injectable()
export class UploadService {
  private readonly logger: Logger;

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: UploadService.name });
  }

  /**
   * Upload a picture to Cloudinary
   * @param file - The file to upload
   * @param userId - Optional user ID for organizing uploads
   * @returns Upload response with URL and metadata
   */
  async uploadPicture(
    file: IMulterFile,
    userId?: string,
  ): Promise<UploadPictureResponseDto> {
    this.logger.info(
      `Uploading picture: ${file.originalname} (${file.size} bytes)`,
    );

    try {
      // Determine folder based on user ID if provided
      const folder = userId
        ? `open-school-portal/users/${userId}`
        : 'open-school-portal/uploads';

      const uploadResult = await this.cloudinaryService.uploadImage(
        file,
        folder,
      );

      this.logger.info(
        `Picture uploaded successfully: ${uploadResult.publicId}`,
      );

      return {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to upload picture: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
