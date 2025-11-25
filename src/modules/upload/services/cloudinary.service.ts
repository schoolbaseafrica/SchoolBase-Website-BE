import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { IMulterFile } from '../../../common/types/multer.types';
import * as sysMsg from '../../../constants/system.messages';

@Injectable()
export class CloudinaryService {
  private readonly logger: Logger;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: CloudinaryService.name });

    // Initialize Cloudinary configuration
    cloudinary.config({
      cloud_name: this.configService.get<string>('cloudinary.cloudName'),
      api_key: this.configService.get<string>('cloudinary.apiKey'),
      api_secret: this.configService.get<string>('cloudinary.apiSecret'),
    });

    this.logger.info('Cloudinary service initialized');
  }

  /**
   * Upload an image file to Cloudinary
   * @param file - The file to upload (Multer file object)
   * @param folder - Optional folder path in Cloudinary
   * @returns Promise with upload result containing URL and public ID
   */
  async uploadImage(
    file: IMulterFile,
    folder?: string,
  ): Promise<{ url: string; publicId: string }> {
    if (!file || !file.buffer) {
      this.logger.error('Invalid file provided for upload');
      throw new BadRequestException(sysMsg.FILE_REQUIRED);
    }

    // File validation (mimetype and size) is handled by FileInterceptor
    // using pictureUploadConfig. If the file reaches this service, it has
    // already passed validation.

    try {
      const uploadOptions: UploadApiOptions = {
        resource_type: 'image',
        folder: folder || 'open-school-portal',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          {
            quality: 'auto',
            fetch_format: 'auto',
          },
        ],
      };

      // Upload to Cloudinary using upload_stream for buffer
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      this.logger.info(
        `Image uploaded successfully to Cloudinary: ${result.public_id}`,
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown upload error';
      this.logger.error(
        `Failed to upload image to Cloudinary: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(sysMsg.IMAGE_UPLOAD_FAILED);
    }
  }

  /**
   * Delete an image from Cloudinary
   * @param publicId - The public ID of the image to delete
   * @returns Promise with deletion result
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.info(`Image deleted from Cloudinary: ${publicId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown deletion error';
      this.logger.error(
        `Failed to delete image from Cloudinary: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException('Failed to delete image');
    }
  }
}
