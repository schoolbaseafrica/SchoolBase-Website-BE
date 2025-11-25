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

    it('should throw ConflictException if installation already completed', async () => {
      const existingSchool: Partial<School> = {
        id: 'existing-id',
        installation_completed: true,
      };

      schoolModelAction.list.mockResolvedValue({
        payload: [existingSchool as School],
        paginationMeta: {},
      });

      await expect(service.processInstallation(validDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.processInstallation(validDto)).rejects.toThrow(
        'school installation already completed',
      );
    });

    it('should throw ConflictException if school name already exists', async () => {
      // First call checks for installation_completed: true (should return empty)
      // Second call checks for name: 'Test School' (should return existing school)
      schoolModelAction.list
        .mockResolvedValueOnce({ payload: [], paginationMeta: {} })
        .mockResolvedValueOnce({
          payload: [{ id: 'existing', name: 'Test School' } as School],
          paginationMeta: {},
        });

      await expect(service.processInstallation(validDto)).rejects.toThrow(
        ConflictException,
      );
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
});
