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
import { DataSource } from 'typeorm';

import * as sysMsg from '../../../constants/system.messages';
import { EmailService } from '../../email/email.service';
import { SchoolModelAction } from '../../school/model-actions/school.action';
import { UserRole } from '../../user/entities/user.entity';
import { UserModelAction } from '../../user/model-actions/user-actions';
import * as csvParser from '../csv-parser';
import { AcceptInviteDto } from '../dto/accept-invite.dto';
import { InviteRole, InviteUserDto } from '../dto/invite-user.dto';
import { InviteStatus } from '../entities/invites.entity';
import { InviteModelAction } from '../invite.model-action';
import { InviteService } from '../invites.service';

// Interfaces
interface IMockModelAction {
  create: jest.Mock;
  get: jest.Mock;
  list: jest.Mock;
  update: jest.Mock;
  save: jest.Mock;
}

describe('InviteService', () => {
  let service: InviteService;
  let inviteModelAction: IMockModelAction;
  let userModelAction: IMockModelAction;
  let emailService: { sendMail: jest.Mock };
  let configService: { get: jest.Mock };
  let dataSource: { transaction: jest.Mock };

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
  //this is for csv only
  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        ['frontend.url']: 'https://school.com',
        ['school.name']: 'Test School',
        ['school.logoUrl']: 'https://school.com/logo.png',
        ['mail.from.adress']: 'noreply@school.com',
        ['mail.from.name']: 'School Admin',
      };
      return config[key];
    }),
  };

  let moduleRef: TestingModule;

  beforeEach(async () => {
    const mockAction = {
      create: jest.fn(),
      get: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };

    const mockLoggerObj = {
      info: jest.fn(),
      error: jest.fn(),
      child: jest.fn().mockReturnThis(),
    };

    const mockDataSource = {
      transaction: jest.fn((cb) => cb({})),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        InviteService,
        { provide: InviteModelAction, useValue: { ...mockAction } },
        { provide: UserModelAction, useValue: { ...mockAction } },
        { provide: SchoolModelAction, useValue: { ...mockAction } },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: { sendMail: jest.fn() } },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLoggerObj },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = moduleRef.get<InviteService>(InviteService);
    inviteModelAction = moduleRef.get(InviteModelAction);
    userModelAction = moduleRef.get(UserModelAction);
    emailService = moduleRef.get(EmailService);
    configService = moduleRef.get(ConfigService);
    dataSource = moduleRef.get(DataSource);
  });

  describe('inviteUser', () => {
    const dto: InviteUserDto = {
      email: 'newuser@example.com',
      role: InviteRole.TEACHER,
      full_name: 'Jane Smith',
    };

    beforeEach(() => {
      jest.clearAllMocks();

      // Default config values
      configService.get.mockImplementation((key: string) => {
        const config = {
          invite: { expiry: '7' },
          frontend: { url: 'https://example.com' },
          app: {
            name: 'Test School',
            logo_url: 'https://example.com/logo.png',
          },
        };
        return key.split('.').reduce((o, k) => o?.[k], config);
      });
    });

    it('should successfully create invite and send email', async () => {
      // Mock: No existing user
      userModelAction.get.mockResolvedValue(null);

      // Mock: No existing invite
      inviteModelAction.get.mockResolvedValue(null);

      // Mock: Create invite
      inviteModelAction.create.mockResolvedValue(mockInvite);

      // Mock: Send email success
      emailService.sendMail.mockResolvedValue(undefined);

      const result = await service.inviteUser(dto);

      // Assertions
      expect(userModelAction.get).toHaveBeenCalledWith({
        identifierOptions: { email: dto.email },
      });

      expect(inviteModelAction.get).toHaveBeenCalledWith({
        identifierOptions: {
          email: dto.email,
          status: InviteStatus.PENDING,
        },
      });

      expect(inviteModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createPayload: expect.objectContaining({
            email: dto.email,
            role: dto.role,
            full_name: dto.full_name,
            status: InviteStatus.PENDING,
            accepted: false,
          }),
          transactionOptions: expect.objectContaining({
            useTransaction: true,
          }),
        }),
      );

      expect(emailService.sendMail).toHaveBeenCalled();

      expect(result).toEqual({
        id: mockInvite.id,
        email: mockInvite.email,
        role: mockInvite.role,
        full_name: mockInvite.full_name,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      // Mock: Existing user
      userModelAction.get.mockResolvedValue({
        id: 'existing-user',
        email: dto.email,
      });

      await expect(service.inviteUser(dto)).rejects.toThrow(
        sysMsg.ACCOUNT_ALREADY_EXISTS,
      );

      expect(inviteModelAction.create).not.toHaveBeenCalled();
      expect(emailService.sendMail).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if active invite exists', async () => {
      // Mock: No existing user
      userModelAction.get.mockResolvedValue(null).mockResolvedValueOnce(null);

      // Mock: Active pending invite
      inviteModelAction.get
        .mockResolvedValueOnce({
          ...mockInvite,
          expires_at: new Date(Date.now() + 100000), // Future date
        })
        .mockResolvedValue(null);

      await expect(service.inviteUser(dto)).rejects.toThrow(
        sysMsg.ACTIVE_INVITE_EXISTS,
      );

      expect(inviteModelAction.create).not.toHaveBeenCalled();
    });

    it('should create new invite if existing invite is expired', async () => {
      // Mock: No existing user
      userModelAction.get.mockResolvedValue(null);

      // Mock: Expired invite
      inviteModelAction.get
        .mockResolvedValue({
          ...mockInvite,
          expires_at: new Date(Date.now() - 10000), // Past date
        })
        .mockResolvedValueOnce(null);

      // Mock: Create new invite
      inviteModelAction.create.mockResolvedValue(mockInvite);

      // Mock: Send email success
      emailService.sendMail.mockResolvedValue(undefined);

      const result = await service.inviteUser(dto);

      expect(inviteModelAction.create).toHaveBeenCalled();
      expect(result.email).toBe(mockInvite.email);
    });

    it('should throw error and rollback transaction if email sending fails', async () => {
      userModelAction.get.mockResolvedValue(null);
      inviteModelAction.get.mockResolvedValue(null);
      inviteModelAction.create.mockResolvedValue(mockInvite);
      emailService.sendMail.mockRejectedValue(new Error('Email send failed'));

      await expect(service.inviteUser(dto)).rejects.toThrow(
        'Email send failed',
      );

      // Invite should have been created but transaction will rollback
      expect(inviteModelAction.create).toHaveBeenCalled();
      expect(emailService.sendMail).toHaveBeenCalled();
    });

    it('should use transaction for invite creation', async () => {
      userModelAction.get.mockResolvedValue(null);
      inviteModelAction.get.mockResolvedValue(null);
      inviteModelAction.create.mockResolvedValue(mockInvite);
      emailService.sendMail.mockResolvedValue(undefined);

      await service.inviteUser(dto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(inviteModelAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionOptions: expect.objectContaining({
            useTransaction: true,
            transaction: expect.anything(),
          }),
        }),
      );
    });
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

  // CSV Upload Tests

  describe('uploadCsv', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      // Mock config values required for uploadCsv
      configService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          ['frontend.url']: 'https://school.com',
          ['school.name']: 'Test School',
          ['school.logoUrl']: 'https://school.com/logo.png',
          ['mail.from.adress']: 'noreply@school.com',
          ['mail.from.name']: 'School Admin',
        };
        return config[key];
      });
    });

    it('should process CSV upload and send invite emails', async () => {
      const mockFile = {
        buffer: Buffer.from(
          'email,full_name\nnew@user.com,New User\nexisting@user.com,Existing User',
        ),
        mimetype: 'text/csv',
        originalname: 'bulk.csv',
      } as Express.Multer.File;

      // Mock parsed CSV rows
      const parsedRows = [
        { email: 'new@user.com', full_name: 'New User' },
        { email: 'existing@user.com', full_name: 'Existing User' },
      ];

      // Mock parseCsv util

      jest.spyOn(csvParser, 'parseCsv').mockResolvedValue(parsedRows);

      // Pretend one email already exists
      inviteModelAction.get.mockResolvedValue([{ email: 'existing@user.com' }]);

      inviteModelAction.create.mockImplementation(({ createPayload }) => ({
        ...createPayload,
        id: 'invite-id',
      }));
      inviteModelAction.save.mockResolvedValue(undefined);

      const emailService = moduleRef.get<EmailService>(EmailService);
      (emailService.sendMail as jest.Mock).mockResolvedValue(undefined);

      const result = await service.uploadCsv(mockFile, InviteRole.ADMIN);

      expect(result.status_code).toBe(HttpStatus.OK);
      expect(result.total_bulk_invites_sent).toBe(1);
      expect(result.skipped_already_exist_emil_on_csv).toEqual([
        'existing@user.com',
      ]);
      expect(emailService.sendMail).toHaveBeenCalledTimes(1);
      expect(emailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.arrayContaining([
            expect.objectContaining({ email: 'new@user.com' }),
          ]),
          subject: expect.stringContaining('ADMIN'),
        }),
      );
    });
  });
});
