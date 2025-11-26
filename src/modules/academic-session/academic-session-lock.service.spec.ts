import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

import * as sysMsg from '../../constants/system.messages';

import { AcademicSessionService } from './academic-session.service';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import {
  AcademicSession,
  SessionStatus,
} from './entities/academic-session.entity';
import { AcademicSessionModelAction } from './model-actions/academic-session-actions';

describe('AcademicSessionService - Session Lock Tests', () => {
  let service: AcademicSessionService;
  let modelAction: jest.Mocked<AcademicSessionModelAction>;

  const mockActiveSession: AcademicSession = {
    id: 'active-session-id',
    name: '2024/2025 Academic Session',
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-06-30'),
    status: SessionStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInactiveSession: AcademicSession = {
    id: 'inactive-session-id',
    name: '2023/2024 Academic Session',
    startDate: new Date('2023-09-01'),
    endDate: new Date('2024-06-30'),
    status: SessionStatus.INACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockModelAction = {
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
      list: jest.fn(),
    };

    const mockDataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicSessionService,
        {
          provide: AcademicSessionModelAction,
          useValue: mockModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<AcademicSessionService>(AcademicSessionService);
    modelAction = module.get(AcademicSessionModelAction);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update() - Session Lock Validation', () => {
    it('should successfully update an ACTIVE session', async () => {
      const updateDto: UpdateAcademicSessionDto = {
        name: 'Updated Session Name',
      };

      const updatedSession = { ...mockActiveSession, name: updateDto.name };

      // First get: fetch the session to update
      // Second get: check for duplicate name (should return null - no duplicate)
      // Third get: fetch updated session after update
      modelAction.get
        .mockResolvedValueOnce(mockActiveSession)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(updatedSession);

      modelAction.update.mockResolvedValueOnce(undefined);

      const result = await service.update(mockActiveSession.id, updateDto);

      expect(result.data.name).toBe(updateDto.name);
      expect(modelAction.update).toHaveBeenCalled();
      expect(modelAction.get).toHaveBeenCalledTimes(3);
    });

    it('should throw ForbiddenException when updating an INACTIVE session', async () => {
      const updateDto: UpdateAcademicSessionDto = {
        name: 'Attempted Update',
      };

      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(
        service.update(mockInactiveSession.id, updateDto),
      ).rejects.toThrow(ForbiddenException);

      expect(modelAction.update).not.toHaveBeenCalled();
    });

    it('should throw correct error message when updating an INACTIVE session', async () => {
      const updateDto: UpdateAcademicSessionDto = {
        name: 'Attempted Update',
      };

      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(
        service.update(mockInactiveSession.id, updateDto),
      ).rejects.toThrow(sysMsg.INACTIVE_SESSION_LOCKED);

      expect(modelAction.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when updating dates of INACTIVE session', async () => {
      const updateDto: UpdateAcademicSessionDto = {
        startDate: '2023-10-01',
        endDate: '2024-07-01',
      };

      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(
        service.update(mockInactiveSession.id, updateDto),
      ).rejects.toThrow(ForbiddenException);

      expect(modelAction.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if session not found', async () => {
      modelAction.get.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent-id', { name: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove() - Session Lock Validation', () => {
    it('should successfully delete an ACTIVE session', async () => {
      modelAction.get.mockResolvedValueOnce(mockActiveSession);
      modelAction.delete.mockResolvedValueOnce(undefined);

      const result = await service.remove(mockActiveSession.id);

      expect(result.status_code).toBe(200);
      expect(modelAction.delete).toHaveBeenCalledWith({
        identifierOptions: { id: mockActiveSession.id },
        transactionOptions: { useTransaction: false },
      });
    });

    it('should throw ForbiddenException when deleting an INACTIVE session', async () => {
      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(service.remove(mockInactiveSession.id)).rejects.toThrow(
        ForbiddenException,
      );

      expect(modelAction.delete).not.toHaveBeenCalled();
    });

    it('should throw correct error message when deleting an INACTIVE session', async () => {
      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(service.remove(mockInactiveSession.id)).rejects.toThrow(
        sysMsg.INACTIVE_SESSION_LOCKED,
      );

      expect(modelAction.delete).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if session not found', async () => {
      modelAction.get.mockResolvedValueOnce(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Session Lock - Business Logic Validation', () => {
    it('should enforce lock even with valid update data', async () => {
      const validUpdateDto: UpdateAcademicSessionDto = {
        name: 'Valid New Name',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(
        service.update(mockInactiveSession.id, validUpdateDto),
      ).rejects.toThrow(ForbiddenException);

      expect(modelAction.update).not.toHaveBeenCalled();
    });

    it('should check session lock before checking for duplicate names', async () => {
      const updateDto: UpdateAcademicSessionDto = {
        name: 'Duplicate Name',
      };

      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      await expect(
        service.update(mockInactiveSession.id, updateDto),
      ).rejects.toThrow(ForbiddenException);

      expect(modelAction.get).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple updates to the same ACTIVE session', async () => {
      const updateDto1: UpdateAcademicSessionDto = { name: 'First Update' };
      const updateDto2: UpdateAcademicSessionDto = { name: 'Second Update' };

      const firstUpdated = { ...mockActiveSession, name: 'First Update' };
      const secondUpdated = { ...mockActiveSession, name: 'Second Update' };

      modelAction.get
        .mockResolvedValueOnce(mockActiveSession)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(firstUpdated)
        .mockResolvedValueOnce(mockActiveSession)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(secondUpdated);

      modelAction.update.mockResolvedValue(undefined);

      await service.update(mockActiveSession.id, updateDto1);
      await service.update(mockActiveSession.id, updateDto2);

      expect(modelAction.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle session status explicitly set to INACTIVE', async () => {
      const sessionWithExplicitStatus: AcademicSession = {
        ...mockInactiveSession,
        status: SessionStatus.INACTIVE,
      };

      modelAction.get.mockResolvedValueOnce(sessionWithExplicitStatus);

      await expect(
        service.update(sessionWithExplicitStatus.id, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should only check status for update operations, not read operations', async () => {
      modelAction.get.mockResolvedValueOnce(mockInactiveSession);

      const result = await service.findOne(mockInactiveSession.id);

      expect(result.data.status).toBe(SessionStatus.INACTIVE);
      expect(result.status_code).toBe(200);
    });
  });
});
