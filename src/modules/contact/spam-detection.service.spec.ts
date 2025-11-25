import { BadRequestException } from '@nestjs/common';

import { CreateContactDto } from '../contact/dto/create-contact.dto';

import { SpamDetectionService } from './spam-detection.service';

describe('SpamDetectionService', () => {
  let service: SpamDetectionService;

  beforeEach(() => {
    service = new SpamDetectionService();
  });

  describe('validateSubmission', () => {
    it('should pass valid submission', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message: 'I would like to inquire about your school portal services.',
      };

      expect(() => service.validateSubmission(dto)).not.toThrow();
    });

    it('should reject spam keywords', () => {
      const dto: CreateContactDto = {
        full_name: 'Spammer',
        email: 'spam@example.com',
        message: 'Buy viagra now! Limited time offer!',
      };

      expect(() => service.validateSubmission(dto)).toThrow(
        BadRequestException,
      );
    });

    it('should reject excessive URLs', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message:
          'Check out https://example1.com and https://example2.com and https://example3.com',
      };

      expect(() => service.validateSubmission(dto)).toThrow(
        BadRequestException,
      );
    });

    it('should allow up to 2 URLs', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message:
          'Please visit our site at https://example1.com or https://example2.com',
      };

      expect(() => service.validateSubmission(dto)).not.toThrow();
    });

    it('should reject repetitive content', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message:
          'spam spam spam spam spam spam spam spam spam spam spam spam spam spam spam spam spam spam spam spam',
      };

      expect(() => service.validateSubmission(dto)).toThrow(
        BadRequestException,
      );
    });

    it('should reject excessive capitalization', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message: 'THIS IS A VERY IMPORTANT MESSAGE PLEASE READ NOW!!!',
      };

      expect(() => service.validateSubmission(dto)).toThrow(
        BadRequestException,
      );
    });

    it('should reject gibberish', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message: 'asdfghjklqwertyzxcvbnm random gibberish content',
      };

      expect(() => service.validateSubmission(dto)).toThrow(
        BadRequestException,
      );
    });

    it('should reject multiple email addresses in message', () => {
      const dto: CreateContactDto = {
        full_name: 'John Doe',
        email: 'john@example.com',
        message:
          'Contact me at spam1@example.com or spam2@example.com or spam3@example.com',
      };

      expect(() => service.validateSubmission(dto)).toThrow(
        BadRequestException,
      );
    });
  });
});
