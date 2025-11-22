import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

export const teacherPhotoConfig: MulterOptions = {
  storage: memoryStorage(), // Store in memory for processing with sharp
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
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
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'),
        false,
      );
    }
  },
};
