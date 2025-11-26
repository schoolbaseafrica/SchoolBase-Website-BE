import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../../constants/system.messages';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { InviteRole } from '../dto/invite-user.dto';
import { InvitesController } from '../invites.controller';
import { InviteService } from '../invites.service';

interface IMockInviteService {
  sendInvite: jest.Mock;
  getPendingInvites: jest.Mock;
  acceptInvite: jest.Mock;
}

describe('InvitesController', () => {
  let controller: InvitesController;
  let service: IMockInviteService;

  beforeEach(async () => {
    const mockService = {
      sendInvite: jest.fn(),
      getPendingInvites: jest.fn(),
      acceptInvite: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitesController],
      providers: [{ provide: InviteService, useValue: mockService }],
    }).compile();

    controller = module.get<InvitesController>(InvitesController);
    service = module.get(InviteService) as unknown as IMockInviteService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ... existing tests ...

  describe('acceptInvite', () => {
    it('should call service to accept invite and return success', async () => {
      const dto: AcceptInviteDto = { token: 'abc', password: '123' };
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        role: InviteRole.TEACHER,
      };

      service.acceptInvite.mockResolvedValue({
        status_code: HttpStatus.CREATED,
        message: sysMsg.ACCOUNT_CREATED,
        data: mockUser,
      });

      const result = await controller.acceptInvite(dto);

      expect(service.acceptInvite).toHaveBeenCalledWith(dto);
      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toBe('Account activated successfully');
      expect(result.data).toEqual({
        status_code: HttpStatus.CREATED,
        message: sysMsg.ACCOUNT_CREATED,
        data: mockUser,
      });
    });
  });
});
