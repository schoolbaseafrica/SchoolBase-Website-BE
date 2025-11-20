import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../constants/system.messages';

import {
  RevokeSessionDto,
  RevokeAllSessionsDto,
} from './dto/session-revoke.dto';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

describe('SessionController', () => {
  let controller: SessionController;
  let service: SessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useValue: {
            revokeSession: jest.fn(),
            revokeAllUserSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    service = module.get<SessionService>(SessionService);
  });

  describe('revoke_session', () => {
    it('should return success response when session is revoked', async () => {
      const dto: RevokeSessionDto = { session_id: 'id1', user_id: 'user1' };
      (service.revokeSession as jest.Mock).mockResolvedValue({
        revoked: true,
        session_id: 'id1',
      });
      const result = await controller.revokeSession(dto);
      expect(result).toEqual({
        status_code: 200,
        message: sysMsg.SESSION_REVOKED,
        data: { revoked: true, session_id: 'id1' },
      });
    });

    it('should throw NotFoundException when session is not found', async () => {
      const dto: RevokeSessionDto = { session_id: 'id2', user_id: 'user2' };
      (service.revokeSession as jest.Mock).mockResolvedValue({
        revoked: false,
        session_id: 'id2',
      });
      await expect(controller.revokeSession(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('revoke_all_sessions', () => {
    it('should return success response for revoke all', async () => {
      const dto: RevokeAllSessionsDto = { user_id: 'user1' };
      (service.revokeAllUserSessions as jest.Mock).mockResolvedValue({
        revoked_count: 2,
      });
      const result = await controller.revokeAllSessions(dto);
      expect(result).toEqual({
        status_code: 200,
        message: sysMsg.SESSIONS_REVOKED,
        data: { revoked_count: 2 },
      });
    });
  });
});
