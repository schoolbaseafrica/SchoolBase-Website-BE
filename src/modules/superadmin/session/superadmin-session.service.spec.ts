import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

import { SuperadminSession } from './entities/superadmin-session.entity';
import { SuperadminSessionService } from './superadmin-session.service';

describe('SuperadminSessionService', () => {
  let service: SuperadminSessionService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperadminSessionService,
        {
          provide: getRepositoryToken(SuperadminSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SuperadminSessionService>(SuperadminSessionService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create and save a session with hashed refresh token', async () => {
      const superadminId = 'superadmin-uuid-1';
      const refreshToken = 'refresh-token-xyz';
      const hashedToken = 'hashed_refresh_token_abc';
      const sessionId = 'session-uuid-1';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedToken as never);

      mockRepository.create.mockReturnValue({
        superadmin_id: superadminId,
        refresh_token: hashedToken,
        expires_at: expiresAt,
        provider: 'jwt',
        is_active: true,
      });

      mockRepository.save.mockResolvedValue({
        id: sessionId,
        superadmin_id: superadminId,
        refresh_token: hashedToken,
        expires_at: expiresAt,
        provider: 'jwt',
        is_active: true,
      });

      const result = await service.createSession(superadminId, refreshToken);

      expect(bcrypt.hash).toHaveBeenCalledWith(refreshToken, 10);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('session_id', sessionId);
      expect(result).toHaveProperty('expires_at');
    });
  });

  describe('revokeSession', () => {
    it('should revoke a session if it exists and belongs to the superadmin', async () => {
      const sessionId = 'session-uuid-1';
      const superadminId = 'superadmin-uuid-1';

      mockRepository.findOne.mockResolvedValue({
        id: sessionId,
        superadmin_id: superadminId,
        is_active: true,
      });

      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.revokeSession(sessionId, superadminId);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: sessionId },
      });
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result).toHaveProperty('revoked', true);
      expect(result).toHaveProperty('session_id', sessionId);
    });

    it('should return revoked: false if session does not exist', async () => {
      const sessionId = 'session-uuid-1';
      const superadminId = 'superadmin-uuid-1';

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.revokeSession(sessionId, superadminId);

      expect(result).toHaveProperty('revoked', false);
      expect(result).toHaveProperty('session_id', sessionId);
    });

    it('should return revoked: false if session belongs to a different superadmin', async () => {
      const sessionId = 'session-uuid-1';
      const superadminId = 'superadmin-uuid-1';
      const differentSuperadminId = 'superadmin-uuid-2';

      mockRepository.findOne.mockResolvedValue({
        id: sessionId,
        superadmin_id: differentSuperadminId,
        is_active: true,
      });

      const result = await service.revokeSession(sessionId, superadminId);

      expect(result).toHaveProperty('revoked', false);
      expect(result).toHaveProperty('session_id', sessionId);
    });
  });

  describe('revokeAllSuperadminSessions', () => {
    it('should revoke all active sessions for a superadmin', async () => {
      const superadminId = 'superadmin-uuid-1';

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 3 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.revokeAllSuperadminSessions(superadminId);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.update).toHaveBeenCalled();
      expect(mockQueryBuilder.set).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
      expect(result).toHaveProperty('revoked_count', 3);
    });

    it('should exclude a session if excludeSessionId is provided', async () => {
      const superadminId = 'superadmin-uuid-1';
      const excludeSessionId = 'session-uuid-1';

      const mockQueryBuilder = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.revokeAllSuperadminSessions(
        superadminId,
        excludeSessionId,
      );

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('revoked_count', 2);
    });
  });
});
