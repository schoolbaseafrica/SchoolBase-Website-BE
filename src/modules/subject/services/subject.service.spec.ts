import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager, In } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../../constants/system.messages';
import {
  AcademicSession,
  SessionStatus,
} from '../../academic-session/entities/academic-session.entity';
import { AcademicSessionModelAction } from '../../academic-session/model-actions/academic-session-actions';
import { ClassSubject } from '../../class/entities/class-subject.entity';
import { Class } from '../../class/entities/class.entity';
import { GradeSubmission } from '../../grade/entities/grade-submission.entity';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { Subject } from '../entities/subject.entity';
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
  let academicSessionModelActionMock: {
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

    academicSessionModelActionMock = {
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
        {
          provide: AcademicSessionModelAction,
          useValue: academicSessionModelActionMock,
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
      classSubjects: [],
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
        classes: undefined,
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
          classSubjects: [],
        },
        {
          id: 'subject-2',
          name: 'Biology',
          createdAt: new Date('2024-01-05T00:00:00Z'),
          updatedAt: new Date('2024-01-06T00:00:00Z'),
          classSubjects: [],
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
            classes: undefined,
          },
          {
            id: 'subject-2',
            name: 'Biology',
            created_at: subjects[1].createdAt,
            updated_at: subjects[1].updatedAt,
            classes: undefined,
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
    it('should return a subject successfully when found without classes', async () => {
      const subject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
        classSubjects: [],
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
          classes: undefined,
        },
      });

      expect(subjectModelActionMock.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
        relations: {
          classSubjects: {
            class: {
              academicSession: true,
            },
            teacher: true,
          },
        },
      });
    });

    it('should return a subject with assigned classes when found', async () => {
      const academicSession = {
        id: 'session-1',
        name: '2024/2025 Academic Year',
      };

      const class1 = {
        id: 'class-1',
        name: 'Grade 10',
        arm: 'A',
        stream: 'Science',
        academicSession,
      };

      const class2 = {
        id: 'class-2',
        name: 'Grade 10',
        arm: 'B',
        stream: undefined,
        academicSession,
      };

      const classSubjects = [
        {
          class: class1,
          teacher_assignment_date: new Date('2024-01-20T08:00:00Z'),
        },
        {
          class: class2,
          teacher_assignment_date: null,
        },
      ];

      const subject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
        classSubjects,
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
          classes: [
            {
              id: 'class-1',
              name: 'Grade 10',
              arm: 'A',
              stream: 'Science',
              academicSession: {
                id: 'session-1',
                name: '2024/2025 Academic Year',
              },
              teacher_assignment_date: new Date('2024-01-20T08:00:00Z'),
            },
            {
              id: 'class-2',
              name: 'Grade 10',
              arm: 'B',
              stream: undefined,
              academicSession: {
                id: 'session-1',
                name: '2024/2025 Academic Year',
              },
              teacher_assignment_date: null,
            },
          ],
        },
      });

      expect(subjectModelActionMock.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
        relations: {
          classSubjects: {
            class: {
              academicSession: true,
            },
            teacher: true,
          },
        },
      });
    });

    it('should throw NotFoundException when subject is not found', async () => {
      subjectModelActionMock.get.mockResolvedValue(undefined);

      const findPromise = service.findOne('non-existent-id');

      await expect(findPromise).rejects.toBeInstanceOf(NotFoundException);
      await expect(findPromise).rejects.toThrow(sysMsg.SUBJECT_NOT_FOUND);

      expect(subjectModelActionMock.get).toHaveBeenCalledWith({
        identifierOptions: { id: 'non-existent-id' },
        relations: {
          classSubjects: {
            class: {
              academicSession: true,
            },
            teacher: true,
          },
        },
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
        classSubjects: [],
      };

      const updatedSubject = {
        ...existingSubject,
        name: updateDto.name,
        updatedAt: new Date('2024-01-05T00:00:00Z'),
        classSubjects: [],
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
          classes: undefined,
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
    it('should delete a subject successfully and unassign from all classes and grade submissions', async () => {
      const existingSubject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      const managerDeleteMock = jest.fn().mockResolvedValue({ affected: 2 });

      subjectModelActionMock.get.mockResolvedValue(existingSubject);
      subjectModelActionMock.delete.mockResolvedValue(undefined);

      // Mock the transaction to include manager.delete
      const managerMock = {
        delete: managerDeleteMock,
        transactionId: 'manager-1',
      } as unknown as EntityManager;

      dataSourceMock.transaction = jest.fn(
        (cb: (manager: EntityManager) => Promise<unknown>) => cb(managerMock),
      );

      const result = await service.remove('subject-1');

      expect(result).toEqual({
        message: sysMsg.SUBJECT_DELETED,
        data: undefined,
      });

      expect(dataSourceMock.transaction).toHaveBeenCalledTimes(1);
      // Verify ClassSubject deletion
      expect(managerDeleteMock).toHaveBeenCalledWith(ClassSubject, {
        subject: { id: 'subject-1' },
      });
      // Verify GradeSubmission deletion
      expect(managerDeleteMock).toHaveBeenCalledWith(GradeSubmission, {
        subject: { id: 'subject-1' },
      });
      expect(subjectModelActionMock.delete).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
        transactionOptions: {
          useTransaction: true,
          transaction: managerMock,
        },
      });
    });

    it('should delete a subject successfully even when no classes or grade submissions are assigned', async () => {
      const existingSubject = {
        id: 'subject-1',
        name: 'Chemistry',
        createdAt: new Date('2024-01-03T00:00:00Z'),
        updatedAt: new Date('2024-01-04T00:00:00Z'),
      };

      const managerDeleteMock = jest.fn().mockResolvedValue({ affected: 0 });

      subjectModelActionMock.get.mockResolvedValue(existingSubject);
      subjectModelActionMock.delete.mockResolvedValue(undefined);

      const managerMock = {
        delete: managerDeleteMock,
        transactionId: 'manager-1',
      } as unknown as EntityManager;

      dataSourceMock.transaction = jest.fn(
        (cb: (manager: EntityManager) => Promise<unknown>) => cb(managerMock),
      );

      const result = await service.remove('subject-1');

      expect(result).toEqual({
        message: sysMsg.SUBJECT_DELETED,
        data: undefined,
      });

      // Verify both ClassSubject and GradeSubmission deletion attempts
      expect(managerDeleteMock).toHaveBeenCalledWith(ClassSubject, {
        subject: { id: 'subject-1' },
      });
      expect(managerDeleteMock).toHaveBeenCalledWith(GradeSubmission, {
        subject: { id: 'subject-1' },
      });
      expect(subjectModelActionMock.delete).toHaveBeenCalledWith({
        identifierOptions: { id: 'subject-1' },
        transactionOptions: {
          useTransaction: true,
          transaction: managerMock,
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

  describe('assignClassesToSubject', () => {
    it('should assign classes to a subject and return correct response', async () => {
      const subjectId = 'subject-1';
      const dto = { classIds: ['class-1', 'class-2'] };

      const subject: Subject = {
        id: subjectId,
        name: 'Biology',
        classSubjects: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const academicSession: AcademicSession = {
        id: 'session-1',
        name: '2024/2025',
        status: SessionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(),
      };

      const classes: Class[] = [
        {
          id: 'class-1',
          name: 'JSS1',
          academicSession,
        } as Class,
        {
          id: 'class-2',
          name: 'JSS2',
          academicSession,
        } as Class,
      ];

      const manager: EntityManager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(subject)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
        find: jest.fn().mockResolvedValue(classes),
        create: jest.fn(),
        save: jest.fn(),
      } as unknown as EntityManager;

      academicSessionModelActionMock.list.mockResolvedValue({
        payload: [academicSession],
      });

      service['dataSource'].transaction = jest.fn(
        (
          ...args:
            | [(manager: EntityManager) => Promise<unknown>]
            | [unknown, (manager: EntityManager) => Promise<unknown>]
        ) => {
          let callback:
            | ((manager: EntityManager) => Promise<unknown>)
            | undefined;
          if (args.length === 1 && typeof args[0] === 'function') {
            callback = args[0] as (manager: EntityManager) => Promise<unknown>;
          } else if (args.length === 2 && typeof args[1] === 'function') {
            callback = args[1] as (manager: EntityManager) => Promise<unknown>;
          }
          if (!callback) throw new Error('Unexpected transaction signature');
          return callback(manager);
        },
      );

      const result = await service.assignClassesToSubject(subjectId, dto);

      const expected = {
        message: 'Classes successfully assigned to subject',
        id: subjectId,
        subjectId: subjectId,
        name: 'Biology',
        classes: [
          {
            id: 'class-1',
            name: 'JSS1',
            arm: undefined,
            academicSession: {
              id: 'session-1',
              name: '2024/2025',
            },
          },
          {
            id: 'class-2',
            name: 'JSS2',
            arm: undefined,
            academicSession: {
              id: 'session-1',
              name: '2024/2025',
            },
          },
        ],
      };

      expect(result).toEqual(expected);
      expect(manager.findOne).toHaveBeenCalledWith(Subject, {
        where: { id: subjectId },
      });
      expect(manager.find).toHaveBeenCalledWith(Class, {
        where: { id: In(dto.classIds) },
        relations: ['academicSession'],
      });
      expect(manager.save).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      const subjectId = 'subject-1';
      const dto = { classIds: ['class-1'] };
      const manager: EntityManager = {
        findOne: jest.fn().mockResolvedValueOnce(null),
      } as unknown as EntityManager;

      const academicSession: AcademicSession = {
        id: 'session-1',
        name: '2024/2025',
        status: SessionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        startDate: new Date(),
        endDate: new Date(),
      };
      academicSessionModelActionMock.list.mockResolvedValue({
        payload: [academicSession],
      });

      service['dataSource'].transaction = jest.fn(
        (
          ...args:
            | [(manager: EntityManager) => Promise<unknown>]
            | [unknown, (manager: EntityManager) => Promise<unknown>]
        ) => {
          let callback:
            | ((manager: EntityManager) => Promise<unknown>)
            | undefined;
          if (args.length === 1 && typeof args[0] === 'function') {
            callback = args[0] as (manager: EntityManager) => Promise<unknown>;
          } else if (args.length === 2 && typeof args[1] === 'function') {
            callback = args[1] as (manager: EntityManager) => Promise<unknown>;
          }
          if (!callback) throw new Error('Unexpected transaction signature');
          return callback(manager);
        },
      );

      await expect(
        service.assignClassesToSubject(subjectId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw NotFoundException if any class does not exist', async () => {
      const subjectId = 'subject-1';
      const dto = { classIds: ['class-1', 'class-2'] };
      const subject: Subject = { id: subjectId, name: 'Biology' } as Subject;
      const manager: EntityManager = {
        findOne: jest.fn().mockResolvedValueOnce(subject),
        find: jest.fn().mockResolvedValue([
          {
            id: 'class-1',
            name: 'JSS1',
            academicSession: {
              id: 'session-1',
              name: '2024/2025',
              status: SessionStatus.ACTIVE,
              createdAt: new Date(),
              updatedAt: new Date(),
              startDate: new Date(),
              endDate: new Date(),
            },
          } as Class,
        ]),
      } as unknown as EntityManager;

      academicSessionModelActionMock.list.mockResolvedValue({ payload: [] });

      service['dataSource'].transaction = jest.fn(
        (
          ...args:
            | [(manager: EntityManager) => Promise<unknown>]
            | [unknown, (manager: EntityManager) => Promise<unknown>]
        ) => {
          let callback:
            | ((manager: EntityManager) => Promise<unknown>)
            | undefined;
          if (args.length === 1 && typeof args[0] === 'function') {
            callback = args[0] as (manager: EntityManager) => Promise<unknown>;
          } else if (args.length === 2 && typeof args[1] === 'function') {
            callback = args[1] as (manager: EntityManager) => Promise<unknown>;
          }
          if (!callback) throw new Error('Unexpected transaction signature');
          return callback(manager);
        },
      );
      await expect(
        service.assignClassesToSubject(subjectId, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
