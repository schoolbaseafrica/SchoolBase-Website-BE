// Mock external modules that have native dependencies BEFORE any imports

const mockSharp = jest.fn();
jest.mock('sharp', () => mockSharp);

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));

import * as fs from 'fs/promises';

import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { CreateInstallationDto } from './dto/create-installation.dto';
import { School } from './entities/school.entity';
import { SchoolModelAction } from './model-actions/school.action';
import { SchoolService } from './school.service';

describe('SchoolService', () => {
  let service: SchoolService;
  let schoolModelAction: jest.Mocked<SchoolModelAction>;

  beforeEach(async () => {
    const mockSchoolModelAction = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchoolService,
        {
          provide: SchoolModelAction,
          useValue: mockSchoolModelAction,
        },
      ],
    }).compile();

    service = module.get<SchoolService>(SchoolService);
    schoolModelAction =
      module.get<jest.Mocked<SchoolModelAction>>(SchoolModelAction);

    // Reset mocks
    jest.clearAllMocks();
    mockSharp.mockReturnValue({
      resize: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      toFile: jest.fn().mockResolvedValue(undefined),
    });
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processInstallation', () => {
    const validDto: CreateInstallationDto = {
      name: 'Test School',
      address: '123 Main Street, Springfield',
      email: 'contact@testschool.edu',
      phone: '+1234567890',
      primary_color: '#1E40AF',
      secondary_color: '#3B82F6',
      accent_color: '#60A5FA',
    };

    it('should successfully create school installation', async () => {
      const mockSchool: Partial<School> = {
        id: 'uuid-123',
        name: 'Test School',
        address: '123 Main Street, Springfield',
        email: 'contact@testschool.edu',
        phone: '+1234567890',
        logo_url: null,
        primary_color: '#1E40AF',
        secondary_color: '#3B82F6',
        accent_color: '#60A5FA',
        installation_completed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });
      schoolModelAction.create.mockResolvedValue(mockSchool as School);

      const result = await service.processInstallation(validDto);

      expect(result).toEqual({
        id: 'uuid-123',
        name: 'Test School',
        address: '123 Main Street, Springfield',
        email: 'contact@testschool.edu',
        phone: '+1234567890',
        logo_url: null,
        primary_color: '#1E40AF',
        secondary_color: '#3B82F6',
        accent_color: '#60A5FA',
        installation_completed: true,
        message: 'school installation completed successfully',
      });
    });

    it('should update existing school installation with new data', async () => {
      const existingSchool: Partial<School> = {
        id: 'existing-id',
        name: 'Old School Name',
        address: 'Old Address',
        email: 'old@email.com',
        phone: '+0000000000',
        logo_url: '/uploads/logos/old-logo.png',
        primary_color: '#000000',
        secondary_color: '#111111',
        accent_color: '#222222',
        installation_completed: true,
      };

      const updatedSchool: Partial<School> = {
        id: 'existing-id',
        name: 'Test School',
        address: '123 Main Street, Springfield',
        email: 'contact@testschool.edu',
        phone: '+1234567890',
        logo_url: '/uploads/logos/old-logo.png',
        primary_color: '#1E40AF',
        secondary_color: '#3B82F6',
        accent_color: '#60A5FA',
        installation_completed: true,
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [existingSchool as School],
        paginationMeta: {},
      });
      schoolModelAction.update.mockResolvedValue(updatedSchool as School);

      const result = await service.processInstallation(validDto);

      expect(schoolModelAction.update).toHaveBeenCalledWith({
        identifierOptions: { id: 'existing-id' },
        updatePayload: {
          name: validDto.name,
          address: validDto.address,
          email: validDto.email,
          phone: validDto.phone,
          logo_url: '/uploads/logos/old-logo.png',
          primary_color: validDto.primary_color,
          secondary_color: validDto.secondary_color,
          accent_color: validDto.accent_color,
          installation_completed: true,
        },
        transactionOptions: { useTransaction: false },
      });

      expect(result).toEqual({
        id: 'existing-id',
        name: 'Test School',
        address: '123 Main Street, Springfield',
        email: 'contact@testschool.edu',
        phone: '+1234567890',
        logo_url: '/uploads/logos/old-logo.png',
        primary_color: '#1E40AF',
        secondary_color: '#3B82F6',
        accent_color: '#60A5FA',
        installation_completed: true,
        message: 'school installation updated successfully',
      });
    });

    it('should update existing school with new logo file', async () => {
      const existingSchool: Partial<School> = {
        id: 'existing-id',
        name: 'Old School',
        address: 'Old Address',
        email: 'old@email.com',
        phone: '+0000000000',
        logo_url: '/uploads/logos/old-logo.png',
        primary_color: '#000000',
        secondary_color: '#111111',
        accent_color: '#222222',
        installation_completed: true,
      };

      const mockFile = {
        buffer: Buffer.from('new-image-data'),
        originalname: 'new-logo.png',
        mimetype: 'image/png',
        size: 2048,
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [existingSchool as School],
        paginationMeta: {},
      });

      // Mock the update to return the school with a dynamically generated logo URL
      schoolModelAction.update.mockImplementation(async (options) => {
        return {
          id: 'existing-id',
          name: validDto.name,
          address: validDto.address,
          email: validDto.email,
          phone: validDto.phone,
          logo_url: options.updatePayload.logo_url,
          primary_color: validDto.primary_color,
          secondary_color: validDto.secondary_color,
          accent_color: validDto.accent_color,
          installation_completed: true,
        } as School;
      });

      const result = await service.processInstallation(validDto, mockFile);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(mockSharp).toHaveBeenCalledWith(mockFile.buffer);
      expect(result.logo_url).toMatch(
        /^\/uploads\/logos\/logo-[a-f0-9]+\.png$/,
      );
      expect(result.message).toBe('school installation updated successfully');
    });

    it('should handle installation without optional colors', async () => {
      const minimalDto: CreateInstallationDto = {
        name: 'Minimal School',
        address: '456 Oak Avenue',
        email: 'info@minimalschool.edu',
        phone: '+0987654321',
      };

      const mockSchool: Partial<School> = {
        id: 'uuid-456',
        name: 'Minimal School',
        address: '456 Oak Avenue',
        email: 'info@minimalschool.edu',
        phone: '+0987654321',
        logo_url: null,
        primary_color: null,
        secondary_color: null,
        accent_color: null,
        installation_completed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });
      schoolModelAction.create.mockResolvedValue(mockSchool as School);

      const result = await service.processInstallation(minimalDto);

      expect(result.name).toBe('Minimal School');
      expect(result.installation_completed).toBe(true);
    });

    it('should successfully process installation with logo file', async () => {
      const mockFile = {
        buffer: Buffer.from('fake-image-data'),
        originalname: 'logo.png',
        mimetype: 'image/png',
        size: 1024,
      };

      const mockSchool: Partial<School> = {
        id: 'uuid-789',
        name: 'Test School',
        address: '123 Main Street, Springfield',
        email: 'contact@testschool.edu',
        phone: '+1234567890',
        logo_url: '/uploads/logos/logo-abc123.png',
        primary_color: '#1E40AF',
        secondary_color: '#3B82F6',
        accent_color: '#60A5FA',
        installation_completed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });
      schoolModelAction.create.mockResolvedValue(mockSchool as School);

      const result = await service.processInstallation(validDto, mockFile);

      expect(fs.mkdir).toHaveBeenCalled();
      expect(mockSharp).toHaveBeenCalledWith(mockFile.buffer);
      expect(result.name).toBe('Test School');
      expect(result.logo_url).toMatch(
        /^\/uploads\/logos\/logo-[a-f0-9]+\.png$/,
      );
    });
  });

  describe('getSchoolDetails', () => {
    it('should return school details when school exists', async () => {
      const mockSchool = {
        id: 'uuid-123',
        name: 'Test School',
        address: '123 Main Street',
        email: 'test@school.com',
        phone: '1234567890',
        logo_url: 'logo.png',
        primary_color: '#000000',
        secondary_color: '#ffffff',
        accent_color: '#cccccc',
        installation_completed: true,
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [mockSchool as School],
        paginationMeta: {},
      });

      const result = await service.getSchoolDetails();

      expect(result).toEqual(mockSchool);
      expect(schoolModelAction.list).toHaveBeenCalledWith({
        filterRecordOptions: { installation_completed: true },
      });
    });

    it('should throw ConflictException when no school exists', async () => {
      schoolModelAction.list.mockResolvedValue({
        payload: [],
        paginationMeta: {},
      });

      await expect(service.getSchoolDetails()).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
