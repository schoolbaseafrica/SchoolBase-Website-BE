import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { DepartmentModelAction } from '../model-actions/department.actions';
import { DepartmentService } from '../services/department.service';

import { DepartmentController } from './department.controller';

describe('DepartmentController', () => {
  let controller: DepartmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentController],
      providers: [
        DepartmentService,
        {
          provide: DepartmentModelAction,
          useValue: {
            get: jest.fn(),
            list: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: {
            child: jest.fn().mockReturnValue({
              log: jest.fn(),
              error: jest.fn(),
              warn: jest.fn(),
              debug: jest.fn(),
              verbose: jest.fn(),
            }),
          } as unknown as Logger,
        },
      ],
    }).compile();

    controller = module.get<DepartmentController>(DepartmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
