import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { DepartmentModelAction } from '../../department/model-actions/department.actions';
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
  let departmentModelActionMock: {
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

    departmentModelActionMock = {
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
          provide: DepartmentModelAction,
          useValue: departmentModelActionMock,
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
    departmentIds: ['dep-1'],
  };

  it('should create a subject successfully when provided with valid data', async () => {
    const departments = [
      {
        id: 'dep-1',
        name: 'Science',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      },
    ];
    const subject = {
      id: 'subject-1',
      name: baseDto.name,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      updatedAt: new Date('2024-01-04T00:00:00Z'),
    };

    subjectModelActionMock.get.mockResolvedValue(undefined);
    departmentModelActionMock.list.mockResolvedValue({ payload: departments });
    subjectModelActionMock.create.mockResolvedValue(subject);

    const result = await service.create(baseDto);

    expect(result).toEqual({
      message: sysMsg.SUBJECT_CREATED,
      data: {
        id: subject.id,
        name: subject.name,
        departments: [
          {
            id: 'dep-1',
            name: 'Science',
            created_at: departments[0].createdAt,
            updated_at: departments[0].updatedAt,
          },
        ],
        created_at: subject.createdAt,
        updated_at: subject.updatedAt,
      },
    });

    expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
    expect(subjectModelActionMock.create).toHaveBeenCalledWith({
      createPayload: {
        name: baseDto.name,
        departments,
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

    expect(departmentModelActionMock.list).not.toHaveBeenCalled();
    expect(subjectModelActionMock.create).not.toHaveBeenCalled();
  });

  it('should throw NotFoundException and list missing departments', async () => {
    const dto: CreateSubjectDto = {
      name: 'Further Maths',
      departmentIds: ['dep-1', 'dep-2'],
    };

    subjectModelActionMock.get.mockResolvedValue(undefined);
    departmentModelActionMock.list.mockResolvedValue({
      payload: [
        {
          id: 'dep-1',
          name: 'Science',
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-02T00:00:00Z'),
        },
      ],
    });

    const creationPromise = service.create(dto);

    await expect(creationPromise).rejects.toBeInstanceOf(NotFoundException);
    await expect(creationPromise).rejects.toThrow('dep-2');
    expect(subjectModelActionMock.create).not.toHaveBeenCalled();
  });
});
