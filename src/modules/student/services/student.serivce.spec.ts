import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import { ClassStudentModelAction } from 'src/modules/class/model-actions/class-student.action';
import { ClassModelAction } from 'src/modules/class/model-actions/class.actions';

import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { FileService } from '../../shared/file/file.service';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { StudentModelAction } from '../model-actions';

import { StudentService } from './student.service';

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
  child: jest.fn().mockReturnThis(),
} as unknown as jest.Mocked<Logger>;

const mockStudentModelAction = {
  get: jest.fn(),
  create: jest.fn(),
  generateRegistrationNumber: jest.fn(),
};

const mockUserModelAction = {
  get: jest.fn(),
  create: jest.fn(),
};

const mockDataSource = {
  transaction: jest.fn(),
};

const mockFileService = {
  validatePhotoUrl: jest.fn(),
} as unknown as jest.Mocked<FileService>;

const mockClassStudentModelAction = { list: jest.fn() };
const mockClassModelAction = { find: jest.fn() };
const mockAcademicSessionModelAction = { find: jest.fn() };

describe('StudentService', () => {
  let service: StudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: StudentModelAction,
          useValue: mockStudentModelAction,
        },
        {
          provide: UserModelAction,
          useValue: mockUserModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
        {
          provide: ClassStudentModelAction,
          useValue: mockClassStudentModelAction,
        },
        {
          provide: ClassModelAction,
          useValue: mockClassModelAction,
        },
        {
          provide: AcademicSessionModelAction,
          useValue: mockAcademicSessionModelAction,
        },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
