import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, EntityManager } from 'typeorm';
import { Logger } from 'winston';

import { EmailTemplateID } from '../../constants/email-constants';
import * as sysMsg from '../../constants/system.messages';
import { EmailService } from '../email/email.service';

import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact, ContactStatus } from './entities/contact.entity';
import { ContactModelAction } from './model-actions/contact-actions';

describe('ContactService', () => {
  let service: ContactService;
  let contactModelAction: jest.Mocked<ContactModelAction>;
  let dataSource: jest.Mocked<DataSource>;
  let emailService: jest.Mocked<EmailService>;
  let logger: Logger;

  const mockCreateContactDto: CreateContactDto = {
    full_name: 'John Doe',
    email: 'john@example.com',
    school_name: 'Test School',
    message: 'This is a test message',
  };

  const mockSavedContact: Contact = {
    id: 'contact-123',
    full_name: 'John Doe',
    email: 'john@example.com',
    school_name: 'Test School',
    message: 'This is a test message',
    status: ContactStatus.PENDING,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  };

  const mockLogger = {
    child: jest.fn().mockReturnThis(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockContactModelAction = {
    create: jest.fn(),
  };

  const mockEmailService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: ContactModelAction,
          useValue: mockContactModelAction,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    contactModelAction = module.get(ContactModelAction);
    dataSource = module.get(DataSource);
    emailService = module.get(EmailService);
    logger = module.get(WINSTON_MODULE_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    beforeEach(() => {
      // Setup default mocks
      const mockManager = {} as EntityManager;
      mockDataSource.transaction.mockImplementation(async (callback) => {
        return callback(mockManager);
      });
      mockContactModelAction.create.mockResolvedValue(mockSavedContact);
      mockEmailService.sendMail.mockResolvedValue(undefined);
      mockConfigService.get.mockReturnValue('admin@example.com');
    });

    it('should create a contact and send both emails successfully', async () => {
      const result = await service.create(mockCreateContactDto);

      // Verify transaction was used
      expect(dataSource.transaction).toHaveBeenCalledWith(expect.any(Function));

      // Verify contact was created with correct data
      expect(contactModelAction.create).toHaveBeenCalledWith({
        createPayload: {
          ...mockCreateContactDto,
          status: ContactStatus.PENDING,
        },
        transactionOptions: {
          useTransaction: true,
          transaction: expect.any(Object),
        },
      });

      // Verify both emails were sent
      expect(emailService.sendMail).toHaveBeenCalledTimes(2);

      // Verify admin notification email
      expect(emailService.sendMail).toHaveBeenCalledWith({
        to: [{ email: 'admin@example.com' }],
        subject: 'New Contact Message Received',
        templateNameID: EmailTemplateID.CONTACT_ADMIN_NOTIFICATION,
        templateData: {
          full_name: mockSavedContact.full_name,
          email: mockSavedContact.email,
          school_name: mockSavedContact.school_name,
          message: mockSavedContact.message,
          contact_id: mockSavedContact.id,
          submitted_at: mockSavedContact.created_at.toISOString(),
        },
      });

      // Verify user confirmation email
      expect(emailService.sendMail).toHaveBeenCalledWith({
        to: [
          {
            email: mockCreateContactDto.email,
            name: mockCreateContactDto.full_name,
          },
        ],
        subject: 'Contact Form Submission Confirmation',
        templateNameID: EmailTemplateID.CONTACT_USER_CONFIRMATION,
        templateData: {
          full_name: mockCreateContactDto.full_name,
          message: mockCreateContactDto.message,
        },
      });

      // Verify success logging
      expect(logger.info).toHaveBeenCalledWith('Contact message received', {
        contact_id: mockSavedContact.id,
        email: mockCreateContactDto.email,
        admin_email_sent: true,
        user_email_sent: true,
      });

      // Verify response
      expect(result).toEqual({
        message: sysMsg.CONTACT_MESSAGE_SENT,
        contact_id: mockSavedContact.id,
      });
    });

    it('should handle missing school_name gracefully', async () => {
      const dtoWithoutSchool = { ...mockCreateContactDto };
      delete dtoWithoutSchool.school_name;

      const contactWithoutSchool = { ...mockSavedContact, school_name: null };
      mockContactModelAction.create.mockResolvedValue(contactWithoutSchool);

      await service.create(dtoWithoutSchool);

      // Verify admin email uses "Not provided" for missing school_name
      expect(emailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          templateData: expect.objectContaining({
            school_name: 'Not provided',
          }),
        }),
      );
    });

    it('should continue and log error when admin email fails', async () => {
      const emailError = new Error('SMTP server unavailable');
      mockEmailService.sendMail
        .mockRejectedValueOnce(emailError) // Admin email fails
        .mockResolvedValueOnce(undefined); // User email succeeds

      const result = await service.create(mockCreateContactDto);

      // Verify contact was still created
      expect(result).toEqual({
        message: sysMsg.CONTACT_MESSAGE_SENT,
        contact_id: mockSavedContact.id,
      });

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send admin notification',
        {
          error: emailError,
          contact_id: mockSavedContact.id,
        },
      );

      // Verify success log shows partial success
      expect(logger.info).toHaveBeenCalledWith('Contact message received', {
        contact_id: mockSavedContact.id,
        email: mockCreateContactDto.email,
        admin_email_sent: false,
        user_email_sent: true,
      });
    });

    it('should continue and log error when user email fails', async () => {
      const emailError = new Error('Invalid recipient email');
      mockEmailService.sendMail
        .mockResolvedValueOnce(undefined) // Admin email succeeds
        .mockRejectedValueOnce(emailError); // User email fails

      const result = await service.create(mockCreateContactDto);

      // Verify contact was still created
      expect(result).toEqual({
        message: sysMsg.CONTACT_MESSAGE_SENT,
        contact_id: mockSavedContact.id,
      });

      // Verify error was logged
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send user confirmation',
        {
          error: emailError,
          contact_id: mockSavedContact.id,
        },
      );

      // Verify success log shows partial success
      expect(logger.info).toHaveBeenCalledWith('Contact message received', {
        contact_id: mockSavedContact.id,
        email: mockCreateContactDto.email,
        admin_email_sent: true,
        user_email_sent: false,
      });
    });

    it('should continue when both emails fail', async () => {
      mockEmailService.sendMail.mockRejectedValue(
        new Error('Email service down'),
      );

      const result = await service.create(mockCreateContactDto);

      // Verify contact was still created
      expect(result).toEqual({
        message: sysMsg.CONTACT_MESSAGE_SENT,
        contact_id: mockSavedContact.id,
      });

      // Verify both errors were logged
      expect(logger.error).toHaveBeenCalledTimes(2);

      // Verify success log shows both failed
      expect(logger.info).toHaveBeenCalledWith('Contact message received', {
        contact_id: mockSavedContact.id,
        email: mockCreateContactDto.email,
        admin_email_sent: false,
        user_email_sent: false,
      });
    });

    it('should use default admin email when config is not set', async () => {
      mockConfigService.get.mockReturnValue(undefined);

      await service.create(mockCreateContactDto);

      // Verify default email is used
      expect(emailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [{ email: 'support@openschoolportal.com' }],
        }),
      );
    });

    it('should rollback transaction when contact creation fails', async () => {
      const dbError = new Error('Database connection failed');
      mockContactModelAction.create.mockRejectedValue(dbError);

      await expect(service.create(mockCreateContactDto)).rejects.toThrow(
        dbError,
      );

      // Verify emails were not attempted
      expect(emailService.sendMail).not.toHaveBeenCalled();
    });

    it('should send emails in parallel (performance check)', async () => {
      const emailDelay = 100;

      mockEmailService.sendMail.mockImplementation(async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, emailDelay);
        });
      });

      const startTime = Date.now();
      await service.create(mockCreateContactDto);
      const totalTime = Date.now() - startTime;

      // If emails were sent in parallel, total time should be ~100ms
      // If sequential, it would be ~200ms
      // Allow some buffer for execution overhead
      expect(totalTime).toBeLessThan(emailDelay * 1.5);
    });

    it('should log individual email successes', async () => {
      await service.create(mockCreateContactDto);

      expect(logger.info).toHaveBeenCalledWith('Admin notification sent', {
        contact_id: mockSavedContact.id,
      });

      expect(logger.info).toHaveBeenCalledWith('User confirmation sent', {
        email: mockCreateContactDto.email,
      });
    });
  });
});
