import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { FeesModelAction } from '../../fees/model-action/fees.model-action';
import { NotificationModelAction } from '../model-actions/notification.model-action';
import { FeeNotificationService } from '../services/fee-notification.service';

describe('FeeNotificationService', () => {
  let service: FeeNotificationService;
  // let notificationModelAction: jest.Mocked<NotificationModelAction>;
  // let feesModelAction: jest.Mocked<FeesModelAction>;

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeeNotificationService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: NotificationModelAction,
          useValue: {
            createMany: jest.fn(),
          },
        },
        {
          provide: FeesModelAction,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeeNotificationService>(FeeNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
