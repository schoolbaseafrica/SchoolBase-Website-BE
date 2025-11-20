import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
});
