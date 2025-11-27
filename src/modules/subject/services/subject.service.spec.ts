import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
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

  describe('findOne', () => {
    it('should return a subject successfully when found', async () => {
      const subject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      subjectModelActionMock.get.mockResolvedValue(subject);

      const result = await service.findOne('subject-1');

      expect(result).toEqual({
        message: sysMsg.SUBJECT_RETRIEVED,
        data: {
          id: subject.id,
          name: subject.name,
          created_at: subject.createdAt,
          updated_at: subject.updatedAt,
        },
      });

      expect(subjectModelActionMock.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
      });
    });

    it('should throw NotFoundException when subject is not found', async () => {
      subjectModelActionMock.get.mockResolvedValue(undefined);

      const findPromise = service.findOne('non-existent-id');

      await expect(findPromise).rejects.toBeInstanceOf(NotFoundException);
      await expect(findPromise).rejects.toThrow(sysMsg.SUBJECT_NOT_FOUND);

      expect(subjectModelActionMock.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'non-existent-id' },
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateSubjectDto = {
      name: 'Advanced Chemistry',
    };

    it('should update a subject successfully when provided with valid data', async () => {
      const existingSubject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      const updatedSubject = {
        ...existingSubject,
        name: updateDto.name,
        updatedAt: new Date('2024-01-05T00:00:00Z'),
      };

      subjectModelActionMock.get
        .mockResolvedValueOnce(existingSubject) // First call: check if exists
        .mockResolvedValueOnce(undefined); // Second call: check for name conflict
      subjectModelActionMock.update.mockResolvedValue(updatedSubject);

      const result = await service.update('subject-1', updateDto);

      expect(result).toEqual({
        message: sysMsg.SUBJECT_UPDATED,
        data: {
          id: updatedSubject.id,
          name: updatedSubject.name,
          created_at: updatedSubject.createdAt,
          updated_at: updatedSubject.updatedAt,
        },
      });

      expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
      expect(subjectModelActionMock.update).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
        updatePayload: { name: updateDto.name },
        transactionOptions: {
          useTransaction: true,
          transaction: entityManagerMock,
        },
      });
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      subjectModelActionMock.get.mockResolvedValue(undefined);

      const updatePromise = service.update('non-existent-id', updateDto);

      await expect(updatePromise).rejects.toBeInstanceOf(NotFoundException);
      await expect(updatePromise).rejects.toThrow(sysMsg.SUBJECT_NOT_FOUND);

      expect(subjectModelActionMock.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if new name conflicts with existing subject', async () => {
      const existingSubject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      const conflictingSubject = {
        id: 'subject-2',
        name: 'Advanced Chemistry',
        createdAt: new Date('2024-01-05T00:00:00Z'),
        updatedAt: new Date('2024-01-06T00:00:00Z'),
      };

      subjectModelActionMock.get
        .mockResolvedValueOnce(existingSubject) // First call: check if exists
        .mockResolvedValueOnce(conflictingSubject); // Second call: check for name conflict

      const updatePromise = service.update('subject-1', updateDto);

      await expect(updatePromise).rejects.toBeInstanceOf(ConflictException);
      await expect(updatePromise).rejects.toThrow(
        sysMsg.SUBJECT_ALREADY_EXISTS,
      );

      expect(subjectModelActionMock.update).not.toHaveBeenCalled();
    });

    it('should not check for conflicts if name is not changed', async () => {
      const existingSubject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      const updateDtoSameName: UpdateSubjectDto = {
        name: 'Chemistry',
      };

      subjectModelActionMock.get.mockResolvedValueOnce(existingSubject);
      subjectModelActionMock.update.mockResolvedValue(existingSubject);

      await service.update('subject-1', updateDtoSameName);

      // Should only call get once (to check existence), not for conflict check
      expect(subjectModelActionMock.get).toHaveBeenCalledTimes(1);
      expect(subjectModelActionMock.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a subject successfully', async () => {
      const existingSubject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      subjectModelActionMock.get.mockResolvedValue(existingSubject);
      subjectModelActionMock.delete.mockResolvedValue(undefined);

      const result = await service.remove('subject-1');

      expect(result).toEqual({
        message: sysMsg.SUBJECT_DELETED,
        data: undefined,
      });

      expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
      expect(subjectModelActionMock.delete).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
        transactionOptions: {
          useTransaction: true,
          transaction: entityManagerMock,
        },
      });
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      subjectModelActionMock.get.mockResolvedValue(undefined);

      const deletePromise = service.remove('non-existent-id');

      await expect(deletePromise).rejects.toBeInstanceOf(NotFoundException);
      await expect(deletePromise).rejects.toThrow(sysMsg.SUBJECT_NOT_FOUND);

      expect(subjectModelActionMock.delete).not.toHaveBeenCalled();
    });
  });
});
