import { Readable } from 'stream';

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

  // // ✅ START: Test for CSV bulk upload
  describe('uploadCsvToS3', () => {
    it('should create invites for valid new emails and skip duplicates', async () => {
      const csvContent = `email,role,full_name
        existing@example.com,TEACHER,Alice
        new1@example.com,PARENT,Bob
        new2@example.com,PARENT,Charlie`;

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'bulk.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent, 'utf-8'),
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from(csvContent),
      };

      // Simulate one existing email
      mockInviteRepo.find.mockResolvedValue([
        { id: '1', email: 'existing@example.com' },
      ]);

      mockInviteRepo.create.mockImplementation((dto) => ({
        ...dto,
        id: Math.random().toString(),
        invitedAt: new Date(),
      }));

      mockInviteRepo.save.mockImplementation((invite) =>
        Promise.resolve(invite),
      );

      const result = await service.uploadCsvToS3(mockFile);

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.message).toContain('invites sent');
      expect(result.data).toHaveLength(2); // new1 and new2
      expect(result.skipped_already_exist_emil_on_csv).toContain(
        'existing@example.com',
      );
    });

    it('should return conflict if all emails already exist', async () => {
      const csvContent = `email,role,full_name
        existing1@example.com,TEACHER,Alice
        existing2@example.com,PARENT,Bob`;

      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'bulk.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: csvContent.length,
        buffer: Buffer.from(csvContent, 'utf-8'),
        destination: '',
        filename: '',
        path: '',
        stream: Readable.from(csvContent),
      };

      mockInviteRepo.find.mockResolvedValue([
        { id: '1', email: 'existing1@example.com' },
        { id: '2', email: 'existing2@example.com' },
      ]);

      const result = await service.uploadCsvToS3(mockFile);

      expect(result.status_code).toBe(HttpStatus.BAD_REQUEST);
      expect(result.message).toBe(sysMsg.BULK_UPLOAD_NO_NEW_EMAILS);
      expect(result.data).toHaveLength(0);
    });
  });
});
