import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

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

describe('StudentService', () => {
  let service: StudentService;
  // let studentModelAction: jest.Mocked<StudentModelAction>;
  // let userModelAction: jest.Mocked<UserModelAction>;
  // let fileService: jest.Mocked<FileService>;
  // let dataSource: jest.Mocked<DataSource>;

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
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
    // studentModelAction = module.get(StudentModelAction);
    // userModelAction = module.get(UserModelAction);
    // fileService = module.get(FileService);
    // dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
