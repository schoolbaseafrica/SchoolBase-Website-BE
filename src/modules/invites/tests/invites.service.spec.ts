import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as sysMsg from '../../../constants/system.messages';
import { InviteUserDto, InviteRole } from '../dto/invite-user.dto';
import { PendingInvitesResponseDto } from '../dto/pending-invite.dto';
import { Invite } from '../entities/invites.entity';
import { InviteService } from '../invites.service';

describe('InviteService', () => {
  let service: InviteService;

  const mockInviteRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: getRepositoryToken(Invite), useValue: mockInviteRepo },
      ],
    }).compile();

    service = module.get<InviteService>(InviteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendInvite', () => {
    it('should create a new invite if email does not exist', async () => {
      mockInviteRepo.findOne.mockResolvedValue(null);
      mockInviteRepo.create.mockReturnValue({
        id: '1',
        email: 'test@example.com',
        invitedAt: new Date(),
        role: InviteRole.TEACHER,
        full_name: 'John Doe',
      });
      mockInviteRepo.save.mockResolvedValue({});

      const payload: InviteUserDto = {
        email: 'test@example.com',
        role: InviteRole.TEACHER,
        full_name: 'John Doe',
      };
      const result = await service.sendInvite(payload);

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.INVITE_SENT);
      expect(result.data[0].email).toBe(payload.email);
    });

    it('should return conflict if email already exists', async () => {
      mockInviteRepo.findOne.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
      });

      const payload: InviteUserDto = {
        email: 'test@example.com',
        role: InviteRole.TEACHER,
      };
      const result = await service.sendInvite(payload);

      expect(result.status_code).toBe(HttpStatus.CONFLICT);
      expect(result.message).toBe(sysMsg.INVITE_ALREADY_SENT);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getPendingInvites', () => {
    it('should return pending invites if they exist', async () => {
      const invites = [
        { id: '1', email: 'test@example.com', invitedAt: new Date() },
      ];
      mockInviteRepo.find.mockResolvedValue(invites);

      const result: PendingInvitesResponseDto =
        await service.getPendingInvites();

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe(sysMsg.PENDING_INVITES_FETCHED);
      expect(result.data).toHaveLength(invites.length);
    });

    it('should return NOT_FOUND if no pending invites', async () => {
      mockInviteRepo.find.mockResolvedValue([]);

      const result: PendingInvitesResponseDto =
        await service.getPendingInvites();

      expect(result.status_code).toBe(HttpStatus.NOT_FOUND);
      expect(result.message).toBe(sysMsg.NO_PENDING_INVITES);
      expect(result.data).toHaveLength(0);
    });
  });
});
