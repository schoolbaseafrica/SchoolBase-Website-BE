// Mock external modules that have native dependencies BEFORE any imports
/* eslint-disable @typescript-eslint/naming-convention */
jest.mock('sharp', () => ({
  __esModule: true,
  default: jest.fn(),
}));
/* eslint-enable @typescript-eslint/naming-convention */
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  unlink: jest.fn(),
}));

import * as fs from 'fs/promises';

import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import sharp from 'sharp';

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
    (sharp as unknown as jest.Mock).mockReturnValue({
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
      primary_color: '#1E40AF',
      secondary_color: '#3B82F6',
      accent_color: '#60A5FA',
    };

    it('should successfully create school installation', async () => {
      const mockSchool: Partial<School> = {
        id: 'uuid-123',
        name: 'Test School',
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
      };

      const mockSchool: Partial<School> = {
        id: 'uuid-456',
        name: 'Minimal School',
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
  });
});
