import { Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileService {
  /**
   * Validate a photo URL
   * @param photoUrl The URL to the photo
   * @returns The validated URL
   * @throws BadRequestException if URL is invalid
   */
  validatePhotoUrl(photoUrl: string): string {
    if (!photoUrl || typeof photoUrl !== 'string') {
      throw new BadRequestException(
        'Photo URL is required and must be a string',
      );
    }

    // Validate URL format
    try {
      const url = new URL(photoUrl);

      // Ensure it's HTTP or HTTPS
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new BadRequestException(
          'Photo URL must use HTTP or HTTPS protocol',
        );
      }

      // Validate that it's an image URL (check common image extensions)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const pathname = url.pathname.toLowerCase();
      const hasImageExtension = imageExtensions.some((ext) =>
        pathname.endsWith(ext),
      );

      // Allow URLs without extension (e.g., CDN URLs with query params)
      // But if there's an extension, it should be a valid image type
      if (pathname.includes('.') && !hasImageExtension) {
        throw new BadRequestException(
          'Photo URL must point to a valid image file (JPEG, PNG, WebP, or GIF)',
        );
      }

      return photoUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If URL constructor throws, it's an invalid URL
      throw new BadRequestException('Invalid photo URL format');
    }
  }
}
