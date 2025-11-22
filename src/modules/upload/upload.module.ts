import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CloudinaryService } from './services/cloudinary.service';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, CloudinaryService],
  exports: [UploadService, CloudinaryService],
})
export class UploadModule {}
