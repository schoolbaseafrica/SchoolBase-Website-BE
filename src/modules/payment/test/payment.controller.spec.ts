import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { FileService } from '../../shared/file/file.service';
import { UploadService } from '../../upload/upload.service';
import { PaymentController } from '../controllers/payment.controller';
import { DashboardAnalyticsQueryDto } from '../dto/dashboard-analytics.dto';
import { RecordPaymentDto, PaymentResponseDto } from '../dto/payment.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';
import { DashboardAnalyticsService } from '../services/dashboard-analytics.service';
import { PaymentService } from '../services/payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let paymentService: jest.Mocked<PaymentService>;
  let fileService: jest.Mocked<FileService>;
  let uploadService: jest.Mocked<UploadService>;
  let dashboardAnalyticsService: jest.Mocked<DashboardAnalyticsService>;

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

  const mockPaymentEntityList = [
    mockPaymentEntity,
    {
      ...mockPaymentEntity,
      id: 'payment-id-2',
      amount_paid: 2000,
      student: {
        id: 'student-2',
        user: { first_name: 'Jane', last_name: 'Doe' },
      },
    },
  ] as unknown as Payment[];

  const mockPaginatedResponse = {
    payments: mockPaymentEntityList,
    total: 2,
  };

  const mockPaymentServiceValue = {
    recordPayment: jest.fn(),
    fetchAllPayments: jest.fn(),
  };

  const mockFileServiceValue = {
    validatePhotoUrl: jest.fn(),
  };

  const mockUploadServiceValue = {
    uploadPicture: jest.fn(),
  };

  const mockDashboardAnalyticsServiceValue = {
    getDashboardAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentServiceValue },
        { provide: FileService, useValue: mockFileServiceValue },
        { provide: UploadService, useValue: mockUploadServiceValue },
        {
          provide: DashboardAnalyticsService,
          useValue: mockDashboardAnalyticsServiceValue,
        },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    paymentService = module.get(PaymentService);
    fileService = module.get(FileService);
    uploadService = module.get(UploadService);
    dashboardAnalyticsService = module.get(DashboardAnalyticsService);
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

      expect(result.status_code).toEqual(HttpStatus.CREATED);
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

      expect(result.status_code).toEqual(HttpStatus.CREATED);
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

  describe('fetchAllPayments', () => {
    it('should fetch all payments with default pagination and return 200 OK', async () => {
      mockPaymentServiceValue.fetchAllPayments.mockResolvedValue(
        mockPaginatedResponse,
      );

      const defaultDto = { page: 1, limit: 10 };

      const result = await controller.fetchAllPayments(defaultDto);

      expect(paymentService.fetchAllPayments).toHaveBeenCalledWith(defaultDto);

      expect(result.status_code).toEqual(HttpStatus.OK);
      expect(result.message).toEqual(sysMsg.PAYMENTS_FETCHED_SUCCESSFULLY);
      expect(result.total).toEqual(2);
      expect(result.payments.length).toEqual(2);
      expect(result.payments[0]).toBeInstanceOf(PaymentResponseDto);
    });

    it('should fetch payments with filters applied', async () => {
      mockPaymentServiceValue.fetchAllPayments.mockResolvedValue({
        payments: [mockPaymentEntityList[0]],
        total: 1,
      });

      const filteredDto = {
        page: 1,
        limit: 10,
        student_id: mockStudentId,
        payment_method: PaymentMethod.CASH,
      };

      const result = await controller.fetchAllPayments(filteredDto);

      expect(paymentService.fetchAllPayments).toHaveBeenCalledWith(
        expect.objectContaining(filteredDto),
      );
      expect(result.total).toEqual(1);
    });

    it('should handle no results gracefully', async () => {
      mockPaymentServiceValue.fetchAllPayments.mockResolvedValue({
        payments: [],
        total: 0,
      });

      const result = await controller.fetchAllPayments({});

      expect(result.total).toEqual(0);
      expect(result.payments.length).toEqual(0);
    });

    it('should propagate errors from the service layer', async () => {
      const serviceError = new Error('Database connection error');
      mockPaymentServiceValue.fetchAllPayments.mockRejectedValue(serviceError);

      await expect(controller.fetchAllPayments({})).rejects.toThrow(
        serviceError,
      );
    });
  });

  describe('getDashboardAnalytics', () => {
    it('should return analytics data successfully', async () => {
      const mockAnalyticsData = {
        totals: {
          total_expected_fees: 1000,
          total_paid: 500,
          outstanding_balance: 500,
          transaction_this_month: 10,
        },
        monthly_payments: [],
      };

      mockDashboardAnalyticsServiceValue.getDashboardAnalytics.mockResolvedValue(
        mockAnalyticsData,
      );

      const dto: DashboardAnalyticsQueryDto = { year: 2025 };

      const result = await controller.getDashboardAnalytics(dto);

      expect(
        dashboardAnalyticsService.getDashboardAnalytics,
      ).toHaveBeenCalledWith(dto);
      expect(result.message).toEqual(sysMsg.DASHBOARD_ANALYTICS_FETCHED);
      expect(result.data).toEqual(mockAnalyticsData);
    });
  });
});
