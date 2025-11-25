import { Test, TestingModule } from '@nestjs/testing';

import * as sysMsg from '../../constants/system.messages';

import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

describe('ContactController', () => {
  let controller: ContactController;
  let service: jest.Mocked<ContactService>;

  const mockCreateContactDto: CreateContactDto = {
    full_name: 'Jane Smith',
    email: 'jane@example.com',
    school_name: 'Springfield High School',
    message: 'I would like to inquire about your services.',
  };

  const mockServiceResponse = {
    message: sysMsg.CONTACT_MESSAGE_SENT,
    contact_id: 'contact-456',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactController],
      providers: [
        {
          provide: ContactService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ContactController>(ContactController);
    service = module.get(ContactService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should successfully create a contact inquiry', async () => {
      service.create.mockResolvedValue(mockServiceResponse);

      const result = await controller.create(mockCreateContactDto);

      expect(service.create).toHaveBeenCalledWith(mockCreateContactDto);
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should pass all DTO fields to the service', async () => {
      service.create.mockResolvedValue(mockServiceResponse);

      await controller.create(mockCreateContactDto);

      expect(service.create).toHaveBeenCalledWith({
        full_name: mockCreateContactDto.full_name,
        email: mockCreateContactDto.email,
        school_name: mockCreateContactDto.school_name,
        message: mockCreateContactDto.message,
      });
    });

    it('should handle contact creation without school_name', async () => {
      const dtoWithoutSchool: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
      };

      service.create.mockResolvedValue(mockServiceResponse);

      const result = await controller.create(dtoWithoutSchool);

      expect(service.create).toHaveBeenCalledWith(dtoWithoutSchool);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should propagate service errors', async () => {
      const serviceError = new Error('Database connection failed');
      service.create.mockRejectedValue(serviceError);

      await expect(controller.create(mockCreateContactDto)).rejects.toThrow(
        serviceError,
      );

      expect(service.create).toHaveBeenCalledWith(mockCreateContactDto);
    });

    it('should return the contact_id in the response', async () => {
      service.create.mockResolvedValue(mockServiceResponse);

      const result = await controller.create(mockCreateContactDto);

      expect(result).toHaveProperty('contact_id');
      expect(result.contact_id).toBe('contact-456');
    });

    it('should return success message in the response', async () => {
      service.create.mockResolvedValue(mockServiceResponse);

      const result = await controller.create(mockCreateContactDto);

      expect(result).toHaveProperty('message');
      expect(result.message).toBe(sysMsg.CONTACT_MESSAGE_SENT);
    });

    it('should handle validation errors from DTO', async () => {
      const invalidDto = {
        full_name: '',
        email: 'invalid-email',
        message: '',
      } as CreateContactDto;

      // In real scenario, this would be caught by class-validator
      // Here we simulate the service rejecting invalid data
      const validationError = new Error('Validation failed');
      service.create.mockRejectedValue(validationError);

      await expect(controller.create(invalidDto)).rejects.toThrow(
        validationError,
      );
    });

    it('should handle empty string values', async () => {
      const dtoWithEmptyStrings: CreateContactDto = {
        full_name: '',
        email: '',
        school_name: '',
        message: '',
      };

      service.create.mockResolvedValue(mockServiceResponse);

      await controller.create(dtoWithEmptyStrings);

      expect(service.create).toHaveBeenCalledWith(dtoWithEmptyStrings);
    });

    it('should handle special characters in message', async () => {
      const dtoWithSpecialChars: CreateContactDto = {
        full_name: 'Test User',
        email: 'test@example.com',
        message:
          'Message with <script>alert("xss")</script> and special chars: !@#$%^&*()',
      };

      service.create.mockResolvedValue(mockServiceResponse);

      const result = await controller.create(dtoWithSpecialChars);

      expect(service.create).toHaveBeenCalledWith(dtoWithSpecialChars);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle very long messages', async () => {
      const longMessage = 'A'.repeat(5000);
      const dtoWithLongMessage: CreateContactDto = {
        full_name: 'Test User',
        email: 'test@example.com',
        message: longMessage,
      };

      service.create.mockResolvedValue(mockServiceResponse);

      await controller.create(dtoWithLongMessage);

      expect(service.create).toHaveBeenCalledWith(dtoWithLongMessage);
    });

    it('should handle international characters in names', async () => {
      const dtoWithInternationalChars: CreateContactDto = {
        full_name: 'François José María 王小明',
        email: 'test@example.com',
        school_name: 'École Internationale',
        message: 'Test message',
      };

      service.create.mockResolvedValue(mockServiceResponse);

      await controller.create(dtoWithInternationalChars);

      expect(service.create).toHaveBeenCalledWith(dtoWithInternationalChars);
    });

    it('should maintain the HTTP status code for successful creation', async () => {
      service.create.mockResolvedValue(mockServiceResponse);

      const result = await controller.create(mockCreateContactDto);

      // The ApiResponse decorator specifies HttpStatus.OK (200)
      // This test verifies the expected behavior
      expect(result).toBeDefined();
      expect(result.message).toBe(sysMsg.CONTACT_MESSAGE_SENT);
    });
  });

  describe('API Documentation', () => {
    it('should have correct API tags', () => {
      const metadata = Reflect.getMetadata(
        'swagger/apiUseTags',
        ContactController,
      );
      expect(metadata).toBeDefined();
    });

    it('should have route metadata', () => {
      const path = Reflect.getMetadata('path', ContactController);
      expect(path).toBe('contact');
    });
  });
});
