import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { RecordPaymentDto } from '../dto/payment.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod, PaymentStatus } from '../enums/payment.enums';
import { PaymentModelAction } from '../model-action/payment.model-action';
import { PaymentValidationService } from '../services/payment-validation.service';
import { PaymentService } from '../services/payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentModelAction: jest.Mocked<PaymentModelAction>;
  let paymentValidationService: jest.Mocked<PaymentValidationService>;

  const mockLogger: Partial<Logger> = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockUserId = 'user-uuid-123';
  const mockStudentId = 'student-uuid-456';
  const mockFeeId = 'fee-uuid-789';
  const mockTermId = 'term-uuid-000';
  const mockSessionId = 'session-uuid-111';

  const mockDate = new Date().toISOString();

  const recordPaymentDto: RecordPaymentDto = {
    student_id: mockStudentId,
    fee_component_id: mockFeeId,
    amount_paid: 5000,
    payment_method: PaymentMethod.CASH,
    payment_date: mockDate,
    term_id: mockTermId,
    session_id: mockSessionId,
    invoice_number: 'INV-001',
  };

  const mockPaymentEntity = {
    id: 'payment-uuid-new',
    student_id: mockStudentId,
    fee_component_id: mockFeeId,
    amount_paid: 5000,
    payment_method: PaymentMethod.CASH,
    payment_date: new Date(mockDate),
    term_id: mockTermId,
    session_id: mockSessionId,
    invoice_number: 'INV-001',
    transaction_id: 'HNG/123/123456',
    receipt_url: 'http://receipt.url',
    status: PaymentStatus.PAID,
    recorded_by: mockUserId,
    createdAt: new Date(),
    updatedAt: new Date(),
    student: {
      id: mockStudentId,
      user: {
        first_name: 'John',
        last_name: 'Doe',
      },
    },
  } as unknown as Payment;

  const mockPaymentModelActionValue = {
    create: jest.fn(),
    get: jest.fn(),
  };

  const mockPaymentValidationServiceValue = {
    validatePayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PaymentModelAction,
          useValue: mockPaymentModelActionValue,
        },
        {
          provide: PaymentValidationService,
          useValue: mockPaymentValidationServiceValue,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    paymentModelAction = module.get(PaymentModelAction);
    paymentValidationService = module.get(PaymentValidationService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('recordPayment', () => {
    it('should record a payment successfully', async () => {
      mockPaymentValidationServiceValue.validatePayment.mockResolvedValue(
        undefined,
      );
      mockPaymentModelActionValue.create.mockResolvedValue(mockPaymentEntity);
      mockPaymentModelActionValue.get.mockResolvedValue(mockPaymentEntity);

      const receiptUrl = 'http://receipt.url';

      const result = await service.recordPayment(
        recordPaymentDto,
        mockUserId,
        receiptUrl,
      );

      expect(result).toEqual(mockPaymentEntity);

      expect(paymentValidationService.validatePayment).toHaveBeenCalledWith(
        recordPaymentDto,
      );

      expect(paymentModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            student_id: recordPaymentDto.student_id,
            amount_paid: recordPaymentDto.amount_paid,
            recorded_by: mockUserId,
            receipt_url: receiptUrl,
            transaction_id: expect.stringMatching(/^HNG\/\d+\/\d+$/),
            payment_date: expect.any(Date),
          }),
          transactionOptions: { useTransaction: false },
        }),
      );

      expect(paymentModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { id: mockPaymentEntity.id },
        relations: {
          student: { user: true },
          fee_component: true,
          term: true,
        },
      });
    });

    it('should throw exception if validation fails', async () => {
      const validationError = new BadRequestException(
        'Payment validation failed',
      );
      mockPaymentValidationServiceValue.validatePayment.mockRejectedValue(
        validationError,
      );

      await expect(
        service.recordPayment(recordPaymentDto, mockUserId),
      ).rejects.toThrow(validationError);

      expect(paymentModelAction.create).not.toHaveBeenCalled();
    });

    it('should propagate error if model action create fails', async () => {
      mockPaymentValidationServiceValue.validatePayment.mockResolvedValue(
        undefined,
      );

      const dbError = new Error('Database connection error');
      mockPaymentModelActionValue.create.mockRejectedValue(dbError);

      await expect(
        service.recordPayment(recordPaymentDto, mockUserId),
      ).rejects.toThrow(dbError);
    });
  });
});
