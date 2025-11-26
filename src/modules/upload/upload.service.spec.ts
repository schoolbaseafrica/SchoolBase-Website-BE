import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { IMulterFile } from '../../common/types/multer.types';
import * as sysMsg from '../../constants/system.messages';

import { CloudinaryService } from './services/cloudinary.service';
import { UploadService } from './upload.service';

describe('UploadService', () => {
  let service: UploadService;
  let cloudinaryService: CloudinaryService;

  const mockCloudinaryService = {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };

  const mockFile: IMulterFile = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 102400,
    buffer: Buffer.from('fake-image-data'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: CloudinaryService,
          useValue: mockCloudinaryService,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    cloudinaryService = module.get<CloudinaryService>(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadPicture', () => {
    it('should upload a picture successfully with userId', async () => {
      const userId = 'user-uuid-123';
      const mockUploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg',
        publicId: 'open-school-portal/users/user-uuid-123/test-image',
      };

      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await service.uploadPicture(mockFile, userId);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        `open-school-portal/users/${userId}`,
      );
      expect(result).toEqual({
        url: mockUploadResult.url,
        publicId: mockUploadResult.publicId,
        originalName: mockFile.originalname,
        size: mockFile.size,
        mimetype: mockFile.mimetype,
      });
    });

    it('should upload a picture successfully without userId', async () => {
      const mockUploadResult = {
        url: 'https://res.cloudinary.com/test/image/upload/v1234567890/test-image.jpg',
        publicId: 'open-school-portal/uploads/test-image',
      };

      mockCloudinaryService.uploadImage.mockResolvedValue(mockUploadResult);

      const result = await service.uploadPicture(mockFile);

      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(
        mockFile,
        'open-school-portal/uploads',
      );
      expect(result).toEqual({
        url: mockUploadResult.url,
        publicId: mockUploadResult.publicId,
        originalName: mockFile.originalname,
        size: mockFile.size,
        mimetype: mockFile.mimetype,
      });
    });

    it('should throw error when Cloudinary upload fails', async () => {
      const error = new BadRequestException(sysMsg.IMAGE_UPLOAD_FAILED);
      mockCloudinaryService.uploadImage.mockRejectedValue(error);

      await expect(service.uploadPicture(mockFile)).rejects.toThrow(
        BadRequestException,
      );
      expect(cloudinaryService.uploadImage).toHaveBeenCalled();
    });

    it('should propagate errors from CloudinaryService', async () => {
      const error = new BadRequestException(sysMsg.FILE_TOO_LARGE);
      mockCloudinaryService.uploadImage.mockRejectedValue(error);

      await expect(service.uploadPicture(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
