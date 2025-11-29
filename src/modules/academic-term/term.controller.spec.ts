import { Test, TestingModule } from '@nestjs/testing';

import { TermModelAction } from './model-actions';
import { TermController } from './term.controller';
import { TermService } from './term.service';

describe('TermController', () => {
  let controller: TermController;

  beforeEach(async () => {
    const mockTermModelAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TermController],
      providers: [
        TermService,
        {
          provide: TermModelAction,
          useValue: mockTermModelAction,
        },
      ],
    }).compile();

    controller = module.get<TermController>(TermController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
