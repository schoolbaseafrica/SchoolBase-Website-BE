import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { FileService } from '../../shared/file/file.service';
import { UploadService } from '../../upload/upload.service';
import { PaymentController } from '../controllers/payment.controller';
import { RecordPaymentDto, PaymentResponseDto } from '../dto/payment.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';
import { PaymentService } from '../services/payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;
  let fileService: jest.Mocked<FileService>;
  let uploadService: jest.Mocked<UploadService>;

  const mockUserId = 'user-uuid-123';
  const mockStudentId = 'student-uuid-456';

  const mockDto: RecordPaymentDto = {
    student_id: mockStudentId,
    fee_component_id: 'fee-uuid-789',
    amount_paid: 5000,
    payment_method: PaymentMethod.CASH,
    payment_date: new Date().toISOString(),
    term_id: 'term-uuid-000',
    session_id: 'session-uuid-111',
    invoice_number: 'INV-001',
  };

  const mockFile = {
    fieldname: 'receipt_file',
    originalname: 'receipt.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    size: 1024,
  } as Express.Multer.File;

  const mockPaymentEntity = {
    id: 'payment-id-1',
    student_id: mockStudentId,
    amount_paid: 5000,
    payment_method: PaymentMethod.CASH,
    status: PaymentStatus.PAID,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: mockStudentId,
      user: {
        first_name: 'John',
        last_name: 'Doe',
      },
    },
    fee_component: { id: 'fee-1', component_name: 'Tuition', amount: 5000 },
    term: { id: 'term-1', name: 'First Term' },
  } as unknown as Payment;

  const mockPaymentServiceValue = {
    recordPayment: jest.fn(),
  };

  const mockFileServiceValue = {
    validatePhotoUrl: jest.fn(),
  };

  const mockUploadServiceValue = {
    uploadPicture: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentServiceValue },
        { provide: FileService, useValue: mockFileServiceValue },
        { provide: UploadService, useValue: mockUploadServiceValue },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get(PaymentService);
    fileService = module.get(FileService);
    uploadService = module.get(UploadService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('recordPayment', () => {
    it('should record payment WITH file upload successfully', async () => {
      const mockUploadResult = {
        url: 'http://cloudinary.com/receipt.jpg',
        publicId: '123',
      };
      const validatedUrl = 'http://cloudinary.com/receipt.jpg';

      mockUploadServiceValue.uploadPicture.mockResolvedValue(mockUploadResult);
      mockFileServiceValue.validatePhotoUrl.mockReturnValue(validatedUrl);
      mockPaymentServiceValue.recordPayment.mockResolvedValue(
        mockPaymentEntity,
      );

      const result = await controller.recordPayment(
        mockDto,
        mockUserId,
        mockFile,
      );

      expect(uploadService.uploadPicture).toHaveBeenCalledWith(mockFile);
      expect(fileService.validatePhotoUrl).toHaveBeenCalledWith(
        mockUploadResult.url,
      );

      expect(paymentService.recordPayment).toHaveBeenCalledWith(
        mockDto,
        mockUserId,
        validatedUrl,
      );

      expect(result.message).toEqual(sysMsg.PAYMENT_SUCCESS);
      expect(result.response).toBeInstanceOf(PaymentResponseDto);
      expect(result.response.student.first_name).toEqual('John');
    });

    it('should record payment WITHOUT file upload successfully', async () => {
      mockPaymentServiceValue.recordPayment.mockResolvedValue(
        mockPaymentEntity,
      );

      const result = await controller.recordPayment(
        mockDto,
        mockUserId,
        undefined,
      );

      expect(uploadService.uploadPicture).not.toHaveBeenCalled();
      expect(fileService.validatePhotoUrl).not.toHaveBeenCalled();

      expect(paymentService.recordPayment).toHaveBeenCalledWith(
        mockDto,
        mockUserId,
        undefined,
      );

      expect(result.message).toEqual(sysMsg.PAYMENT_SUCCESS);
      expect(result.response).toBeInstanceOf(PaymentResponseDto);
    });

    it('should throw error if upload fails', async () => {
      const uploadError = new BadRequestException('Upload failed');
      mockUploadServiceValue.uploadPicture.mockRejectedValue(uploadError);

      await expect(
        controller.recordPayment(mockDto, mockUserId, mockFile),
      ).rejects.toThrow(uploadError);

      expect(paymentService.recordPayment).not.toHaveBeenCalled();
    });

    it('should throw error if payment service fails', async () => {
      const serviceError = new Error('Database Error');
      mockPaymentServiceValue.recordPayment.mockRejectedValue(serviceError);

      await expect(
        controller.recordPayment(mockDto, mockUserId, undefined),
      ).rejects.toThrow(serviceError);
    });
  });
});
