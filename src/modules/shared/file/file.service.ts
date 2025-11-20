import * as fs from 'fs/promises';
import * as path from 'path';

import { Injectable, BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';

import { IMulterFile } from '../../../common/types/multer.types';

@Injectable()
export class FileService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  /**
   * Upload and resize a photo
   * @param file The uploaded file
   * @param folder The folder to save the file (e.g., 'teachers')
   * @param filename The base filename (without extension)
   * @param options Resize options
   * @returns The relative path to the saved file
   */
  async uploadPhoto(
    file: IMulterFile,
    folder: string,
    filename: string,
    options?: { width?: number; height?: number },
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 2MB limit.');
    }

    try {
      // Create directory if it doesn't exist
      const folderPath = path.join(this.uploadsDir, folder);
      await fs.mkdir(folderPath, { recursive: true });

      // Get file extension
      const ext = path.extname(file.originalname).toLowerCase();
      const finalFilename = `${filename}${ext}`;
      const filePath = path.join(folderPath, finalFilename);

      // Resize and save image
      const width = options?.width || 150;
      const height = options?.height || 150;

      await sharp(file.buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .toFile(filePath);

      // Return relative path
      return `uploads/${folder}/${finalFilename}`;
    } catch (error) {
      throw new BadRequestException(`Failed to upload photo: ${error.message}`);
    }
  }

  /**
   * Delete a file
   * @param filePath The relative or absolute path to the file
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = filePath.startsWith(this.uploadsDir)
        ? filePath
        : path.join(process.cwd(), filePath);

      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
