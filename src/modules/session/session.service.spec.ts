import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository, UpdateResult, SelectQueryBuilder } from 'typeorm';

import { CannotRevokeOtherSessionsException } from '../../common/exceptions/domain.exceptions';

import { Session } from './entities/session.entity';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let repo: jest.Mocked<Partial<Repository<Session>>>;

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as jest.Mocked<Partial<Repository<Session>>>;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(Session),
          useValue: repo,
        },
      ],
    }).compile();
    service = module.get<SessionService>(SessionService);
  });

  describe('create_session', () => {
    it('should create and return session info', async () => {
      repo.create.mockReturnValue({
        id: 'sid',
        user_id: 'u1',
        refresh_token: 'hash',
        expires_at: new Date(),
        provider: 'jwt',
        is_active: true,
        revoked_at: null,
        user: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Session);
      repo.save.mockResolvedValue({
        id: 'sid',
        user_id: 'u1',
        refresh_token: 'hash',
        expires_at: new Date(),
        provider: 'jwt',
        is_active: true,
        revoked_at: null,
        user: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Session);
      const result = await service.createSession('u1', 'refresh');
      expect(result).toHaveProperty('session_id', 'sid');
      expect(result).toHaveProperty('expires_at');
    });
  });

  describe('revoke_session', () => {
    it('should revoke session if found and owned', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sid',
        user_id: 'u1',
        refresh_token: 'hash',
        expires_at: new Date(),
        provider: 'jwt',
        is_active: true,
        revoked_at: null,
        user: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Session);
      repo.update.mockResolvedValue({
        affected: 1,
        raw: {},
        generatedMaps: [],
      } as UpdateResult);
      const result = await service.revokeSession('sid', 'u1');
      expect(result).toEqual({ revoked: true, session_id: 'sid' });
    });

    it('should return revoked false if session not found', async () => {
      repo.findOne.mockResolvedValue(undefined);
      const result = await service.revokeSession('sid', 'u1');
      expect(result).toEqual({ revoked: false, session_id: 'sid' });
    });

    it('should throw if session owned by another user', async () => {
      repo.findOne.mockResolvedValue({
        id: 'sid',
        user_id: 'u2',
        refresh_token: 'hash',
        expires_at: new Date(),
        provider: 'jwt',
        is_active: true,
        revoked_at: null,
        user: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Session);
      await expect(service.revokeSession('sid', 'u1')).rejects.toThrow(
        CannotRevokeOtherSessionsException,
      );
    });
  });

  describe('revoke_all_user_sessions', () => {
    it('should revoke all sessions for user', async () => {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
          affected: 3,
          raw: {},
          generatedMaps: [],
        } as UpdateResult),
      } as unknown as SelectQueryBuilder<Session>;
      repo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.revokeAllUserSessions('u1');
      expect(result).toEqual({ revoked_count: 3 });
    });

    it('should revoke all except excluded session', async () => {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({
          affected: 2,
          raw: {},
          generatedMaps: [],
        } as UpdateResult),
      } as unknown as SelectQueryBuilder<Session>;
      repo.createQueryBuilder.mockReturnValue(qb);
      const result = await service.revokeAllUserSessions('u1', 'sid2');
      expect(result).toEqual({ revoked_count: 2 });
    });
  });

  describe('validateRefreshToken', () => {
    it('should return session when refresh token matches', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const hashedToken = await bcrypt.hash('valid-refresh-token', 10);

      repo.find.mockResolvedValue([
        {
          id: 'sid1',
          user_id: 'u1',
          refresh_token: hashedToken,
          expires_at: futureDate,
          provider: 'jwt',
          is_active: true,
          revoked_at: null,
          user: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Session,
      ]);

      const result = await service.validateRefreshToken(
        'u1',
        'valid-refresh-token',
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sid1');
      expect(repo.find).toHaveBeenCalledWith({
        where: {
          user_id: 'u1',
          is_active: true,
        },
      });
    });

    it('should return null when refresh token does not match', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const hashedToken = await bcrypt.hash('valid-refresh-token', 10);

      repo.find.mockResolvedValue([
        {
          id: 'sid1',
          user_id: 'u1',
          refresh_token: hashedToken,
          expires_at: futureDate,
          provider: 'jwt',
          is_active: true,
          revoked_at: null,
          user: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Session,
      ]);

      const result = await service.validateRefreshToken(
        'u1',
        'invalid-refresh-token',
      );

      expect(result).toBeNull();
    });

    it('should return null when session has expired', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const hashedToken = await bcrypt.hash('valid-refresh-token', 10);

      repo.find.mockResolvedValue([
        {
          id: 'sid1',
          user_id: 'u1',
          refresh_token: hashedToken,
          expires_at: pastDate,
          provider: 'jwt',
          is_active: true,
          revoked_at: null,
          user: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Session,
      ]);

      const result = await service.validateRefreshToken(
        'u1',
        'valid-refresh-token',
      );

      expect(result).toBeNull();
    });

    it('should return null when no sessions found', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.validateRefreshToken('u1', 'any-token');

      expect(result).toBeNull();
    });

    it('should check multiple sessions and return matching one', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const hashedToken1 = await bcrypt.hash('token1', 10);
      const hashedToken2 = await bcrypt.hash('token2', 10);

      repo.find.mockResolvedValue([
        {
          id: 'sid1',
          user_id: 'u1',
          refresh_token: hashedToken1,
          expires_at: futureDate,
          provider: 'jwt',
          is_active: true,
          revoked_at: null,
          user: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Session,
        {
          id: 'sid2',
          user_id: 'u1',
          refresh_token: hashedToken2,
          expires_at: futureDate,
          provider: 'jwt',
          is_active: true,
          revoked_at: null,
          user: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Session,
      ]);

      const result = await service.validateRefreshToken('u1', 'token2');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('sid2');
    });
  });
});
