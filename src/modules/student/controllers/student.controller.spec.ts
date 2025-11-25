import { Test, TestingModule } from '@nestjs/testing';

import { StudentService } from '../services';

import { StudentController } from './student.controller';

const mockStudentService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<StudentService>;

describe('UserController', () => {
  let controller: StudentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [{ provide: StudentService, useValue: mockStudentService }],
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
