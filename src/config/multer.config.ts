import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

import {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_PICTURE_UPLOAD_SIZE,
  MAX_TEACHER_PHOTO_SIZE,
} from '../constants/file-upload.constants';

export const teacherPhotoConfig: MulterOptions = {
  storage: memoryStorage(), // Store in memory for processing with sharp
  limits: {
    fileSize: MAX_TEACHER_PHOTO_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'),
        false,
      );
    }
  },
};

export const pictureUploadConfig: MulterOptions = {
  storage: memoryStorage(), // Store in memory for Cloudinary upload
  limits: {
    fileSize: MAX_PICTURE_UPLOAD_SIZE,
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'),
        false,
      );
    }
  },
};
