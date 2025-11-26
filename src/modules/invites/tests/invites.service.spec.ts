import { createHash } from 'crypto';

import {
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import * as sysMsg from '../../../constants/system.messages';
import { EmailService } from '../../email/email.service';
import { SchoolModelAction } from '../../school/model-actions/school.action';
import { UserRole } from '../../user/entities/user.entity';
import { UserModelAction } from '../../user/model-actions/user-actions';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { InviteStatus } from '../entities/invites.entity';
import { InviteModelAction } from '../invite.model-action';
import { InviteService } from '../invites.service';

// Interfaces
interface IMockModelAction {
  create: jest.Mock;
  get: jest.Mock;
  list: jest.Mock;
  update: jest.Mock;
}

describe('InviteService', () => {
  let service: InviteService;
  let inviteModelAction: IMockModelAction;
  let userModelAction: IMockModelAction;

  const mockInvite = {
    id: 'invite-uuid',
    email: 'test@example.com',
    role: UserRole.TEACHER,
    full_name: 'John Doe',
    token_hash: 'hashed-token',
    expires_at: new Date(Date.now() + 100000),
    accepted: false,
    status: InviteStatus.PENDING,
  };

  beforeEach(async () => {
    const mockAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    };

    const mockLoggerObj = {
      info: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: InviteModelAction, useValue: { ...mockAction } },
        { provide: UserModelAction, useValue: { ...mockAction } },
        { provide: SchoolModelAction, useValue: { ...mockAction } },

        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EmailService, useValue: { sendMail: jest.fn() } },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLoggerObj },
        // Mocks for injected Repositories (used in constructor but not in acceptInvite)
      ],
    }).compile();

    service = module.get<InviteService>(InviteService);
    inviteModelAction = module.get(InviteModelAction);
    userModelAction = module.get(UserModelAction);
  });

  describe('acceptInvite', () => {
    const dto: AcceptInviteDto = {
      token: 'valid-token',
      password: 'Password123!',
    };
    // Helper to simulate the hash logic inside the service
    const hashedToken = createHash('sha256').update(dto.token).digest('hex');

    it('should create user and update invite if token is valid', async () => {
      // 1. Mock Finding Invite
      inviteModelAction.get.mockResolvedValue(mockInvite);

      // 2. Mock User Creation
      userModelAction.create.mockResolvedValue({
        id: 'new-user-id',
        email: mockInvite.email,
        role: [mockInvite.role],
      });

      const result = await service.acceptInvite(dto);

      // Assert: Check if hashed token was used for lookup
      expect(inviteModelAction.get).toHaveBeenCalledWith(
        expect.objectContaining({
          identifierOptions: expect.objectContaining({
            token_hash: hashedToken,
          }),
        }),
      );

      expect(userModelAction.create).toHaveBeenCalled();
      expect(inviteModelAction.update).toHaveBeenCalledWith(
        expect.objectContaining({ updatePayload: { accepted: true } }),
      );

      expect(result.status_code).toBe(HttpStatus.CREATED);
      expect(result.data.email).toBe(mockInvite.email);
    });

    it('should throw NotFoundException if token is invalid', async () => {
      inviteModelAction.get.mockResolvedValue(null);

      await expect(service.acceptInvite(dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.acceptInvite(dto)).rejects.toThrow(
        sysMsg.INVALID_VERIFICATION_TOKEN,
      );
    });

    it('should throw ConflictException if invite already accepted', async () => {
      inviteModelAction.get.mockResolvedValue({
        ...mockInvite,
        accepted: true,
      });

      await expect(service.acceptInvite(dto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if token expired', async () => {
      inviteModelAction.get.mockResolvedValue({
        ...mockInvite,
        expires_at: new Date(Date.now() - 10000), // Past
      });

      await expect(service.acceptInvite(dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.acceptInvite(dto)).rejects.toThrow(
        sysMsg.TOKEN_EXPIRED,
      );
    });
  });
});
