import { Test, TestingModule } from '@nestjs/testing';

import { FeesModelAction } from '../../fees/model-action/fees.model-action';
import { DashboardAnalyticsQueryDto } from '../dto/dashboard-analytics.dto';
import { PaymentModelAction } from '../model-action/payment.model-action';
import { DashboardAnalyticsService } from '../services/dashboard-analytics.service';

describe('DashboardAnalyticsService', () => {
  let service: DashboardAnalyticsService;
  let feesModelAction: jest.Mocked<FeesModelAction>;
  let paymentModelAction: jest.Mocked<PaymentModelAction>;

  // 1. Mock the Model Actions
  const mockFeesModelActionValue = {
    getTotalExpectedFees: jest.fn(),
  };

  const mockPaymentModelActionValue = {
    getTotalCollected: jest.fn(),
    getCurrentMonthTransactionCount: jest.fn(),
    getMonthlyPaymentBreakdown: jest.fn(),
  };

  // 2. Test Data
  const mockDto: DashboardAnalyticsQueryDto = {
    term_id: 'term-uuid-123',
    session_id: 'session-uuid-456',
    year: 2025,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardAnalyticsService,
        {
          provide: FeesModelAction,
          useValue: mockFeesModelActionValue,
        },
        {
          provide: PaymentModelAction,
          useValue: mockPaymentModelActionValue,
        },
      ],
    }).compile();

    service = module.get<DashboardAnalyticsService>(DashboardAnalyticsService);
    feesModelAction = module.get(FeesModelAction);
    paymentModelAction = module.get(PaymentModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardAnalytics', () => {
    it('should calculate totals and format monthly data correctly', async () => {
      // Arrange
      const expectedFees = 500000;
      const totalPaid = 200000;
      const txCount = 15;

      // Raw data simulates what the DB/ModelAction returns
      const mockMonthlyRaw = [
        { month: 'Jan', month_number: '1', total_payment: '50000' },
        { month: 'Mar', month_number: '3', total_payment: '150000' },
      ];

      mockFeesModelActionValue.getTotalExpectedFees.mockResolvedValue(
        expectedFees,
      );
      mockPaymentModelActionValue.getTotalCollected.mockResolvedValue(
        totalPaid,
      );
      mockPaymentModelActionValue.getCurrentMonthTransactionCount.mockResolvedValue(
        txCount,
      );
      mockPaymentModelActionValue.getMonthlyPaymentBreakdown.mockResolvedValue(
        mockMonthlyRaw,
      );

      // Act
      const result = await service.getDashboardAnalytics(mockDto);

      // Assert - Check Totals
      expect(result.totals).toEqual({
        total_expected_fees: expectedFees,
        total_paid: totalPaid,
        outstanding_balance: 300000, // 500k - 200k
        transaction_this_month: txCount,
      });

      // Assert - Check Monthly Data Filling
      // It should return 12 items (Jan-Dec) even though we only mocked Jan and Mar
      expect(result.monthly_payments).toHaveLength(12);

      // Jan should match mock
      expect(result.monthly_payments[0]).toEqual({
        month: 'Jan',
        total_payment: 50000,
      });

      // Feb was missing in mock, should be filled with 0
      expect(result.monthly_payments[1]).toEqual({
        month: 'Feb',
        total_payment: 0,
      });

      // Check Calls
      expect(feesModelAction.getTotalExpectedFees).toHaveBeenCalledWith(
        mockDto.term_id,
      );
      expect(paymentModelAction.getTotalCollected).toHaveBeenCalledWith(
        mockDto.term_id,
        mockDto.session_id,
      );
      expect(
        paymentModelAction.getMonthlyPaymentBreakdown,
      ).toHaveBeenCalledWith(mockDto.year, mockDto.term_id, mockDto.session_id);
    });

    it('should handle zero values and default year gracefully', async () => {
      // Arrange
      const dtoWithoutYear: DashboardAnalyticsQueryDto = {
        term_id: 'term-1',
      };
      const currentYear = new Date().getFullYear();

      mockFeesModelActionValue.getTotalExpectedFees.mockResolvedValue(0);
      mockPaymentModelActionValue.getTotalCollected.mockResolvedValue(0);
      mockPaymentModelActionValue.getCurrentMonthTransactionCount.mockResolvedValue(
        0,
      );
      mockPaymentModelActionValue.getMonthlyPaymentBreakdown.mockResolvedValue(
        [],
      );

      // Act
      const result = await service.getDashboardAnalytics(dtoWithoutYear);

      // Assert
      expect(result.totals.outstanding_balance).toBe(0);
      expect(result.monthly_payments).toHaveLength(12);
      expect(result.monthly_payments[0].total_payment).toBe(0);

      // Ensure it defaulted to current year
      expect(
        paymentModelAction.getMonthlyPaymentBreakdown,
      ).toHaveBeenCalledWith(currentYear, 'term-1', undefined);
    });
  });
});
