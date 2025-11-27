import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { SubjectModelAction } from '../model-actions/subject.actions';

import { SubjectService } from './subject.service';

describe('SubjectService', () => {
  let service: SubjectService;
  let subjectModelActionMock: {
    get: jest.Mock;
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let dataSourceMock: { transaction: jest.Mock };
  const entityManagerMock = { transactionId: 'manager-1' } as unknown;

  beforeEach(async () => {
    subjectModelActionMock = {
      get: jest.fn(),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    dataSourceMock = {
      transaction: jest.fn((cb: (manager: unknown) => Promise<unknown>) =>
        cb(entityManagerMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectService,
        {
          provide: SubjectModelAction,
          useValue: subjectModelActionMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
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
              info: jest.fn(),
            }),
          } as unknown as Logger,
        },
      ],
    }).compile();

    service = module.get<SubjectService>(SubjectService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const baseDto: CreateSubjectDto = {
    name: 'Chemistry',
  };

  it('should create a subject successfully when provided with valid data', async () => {
    const subject = {
      id: 'subject-1',
      name: baseDto.name,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    };

    subjectModelActionMock.get.mockResolvedValue(undefined);
    subjectModelActionMock.create.mockResolvedValue(subject);

    const result = await service.create(baseDto);

    expect(result).toEqual({
      message: sysMsg.SUBJECT_CREATED,
      data: {
        id: subject.id,
        name: subject.name,
        created_at: subject.createdAt,
        updated_at: subject.updatedAt,
      },
    });

    expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
    expect(subjectModelActionMock.create).toHaveBeenCalledWith({
      createPayload: {
        name: baseDto.name,
      },
      transactionOptions: {
        useTransaction: true,
        transaction: entityManagerMock,
      },
    });
  });

  it('should throw ConflictException if a subject with the same name exists', async () => {
    subjectModelActionMock.get.mockResolvedValue({ id: 'existing-subject' });

    const creationPromise = service.create(baseDto);

    await expect(creationPromise).rejects.toBeInstanceOf(ConflictException);
    await expect(creationPromise).rejects.toThrow(
      sysMsg.SUBJECT_ALREADY_EXISTS,
    );

    expect(subjectModelActionMock.create).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    it('should return all subjects successfully with pagination', async () => {
      const subjects = [
        {
          id: 'subject-1',
          name: 'Chemistry',
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-04T00:00:00Z'),
        },
        {
          id: 'subject-2',
          name: 'Biology',
          createdAt: new Date('2024-01-05T00:00:00Z'),
          updatedAt: new Date('2024-01-06T00:00:00Z'),
        },
      ];

      const paginationMeta = {
        total: 2,
        page: 1,
        limit: 20,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      };

      subjectModelActionMock.list.mockResolvedValue({
        payload: subjects,
        paginationMeta,
      });

      const result = await service.findAll(1, 20);

      expect(result).toEqual({
        message: sysMsg.SUBJECTS_RETRIEVED,
        data: [
          {
            id: 'subject-1',
            name: 'Chemistry',
            created_at: subjects[0].createdAt,
            updated_at: subjects[0].updatedAt,
          },
          {
            id: 'subject-2',
            name: 'Biology',
            created_at: subjects[1].createdAt,
            updated_at: subjects[1].updatedAt,
          },
        ],
        pagination: paginationMeta,
      });

      expect(subjectModelActionMock.list).toHaveBeenCalledWith({
        paginationPayload: { page: 1, limit: 20 },
      });
    });

    it('should return empty array when no subjects exist', async () => {
      const paginationMeta = {
        total: 0,
        page: 1,
        limit: 20,
        total_pages: 0,
        has_next: false,
        has_previous: false,
      };

      subjectModelActionMock.list.mockResolvedValue({
        payload: {},
        paginationMeta,
      });

      const result = await service.findAll();

      expect(result).toEqual({
        message: sysMsg.SUBJECTS_RETRIEVED,
        data: [],
        pagination: paginationMeta,
      });

      expect(subjectModelActionMock.list).toHaveBeenCalledWith({
        paginationPayload: { page: 1, limit: 20 },
      });
    });

    it('should use custom page and limit values', async () => {
      const paginationMeta = {
        total: 50,
        page: 2,
        limit: 10,
        total_pages: 5,
        has_next: true,
        has_previous: true,
      };

      subjectModelActionMock.list.mockResolvedValue({
        payload: {},
        paginationMeta,
      });

      const result = await service.findAll(2, 10);

      expect(result.pagination).toEqual(paginationMeta);
      expect(subjectModelActionMock.list).toHaveBeenCalledWith({
        paginationPayload: { page: 2, limit: 10 },
      });
    });
  });
});
