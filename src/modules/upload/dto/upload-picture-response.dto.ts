import { ApiProperty } from '@nestjs/swagger';

export class UploadPictureResponseDto {
  @ApiProperty({
    description: 'The URL of the uploaded picture',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/sample.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Public ID of the uploaded image in Cloudinary',
    example: 'sample',
  })
  publicId: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'profile-picture.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 102400,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type of the uploaded file',
    example: 'image/jpeg',
  })
  mimetype: string;
}
