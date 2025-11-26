import * as fs from 'fs';
import { join } from 'path';

import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';

import { DatabaseService } from './database.service';
import {
  ConfigureDatabaseDto,
  DatabaseType,
} from './dto/configure-database.dto';
import { DatabaseModelAction } from './model-actions/database-actions';

interface IMockDataSource {
  initialize: jest.Mock;
  query: jest.Mock;
  destroy: jest.Mock;
  isInitialized: boolean;
}

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockLogger: jest.Mocked<Logger>;
  let mockDataSource: IMockDataSource;
  let DataSource: jest.Mock;

  const mockConfigureDatabaseDto: ConfigureDatabaseDto = {
    database_name: 'school_database',
    database_type: DatabaseType.POSTGRES,
    database_host: 'localhost',
    database_username: 'root',
    database_port: 5432,
    database_password: 'password123',
  };

  const mockDatabaseModelAction = {
    get: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    // Mock fs methods
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('');
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'renameSync').mockImplementation(() => {});
    jest.spyOn(fs, 'copyFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'readdirSync').mockReturnValue([]);

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
      child: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Logger>;

    // Mock dataSource
    const typeorm = await import('typeorm');
    DataSource = typeorm.DataSource as jest.Mock;
    mockDataSource = {
      initialize: jest.fn().mockResolvedValue(undefined),
      query: jest.fn().mockResolvedValue([{ column: 1 }]),
      destroy: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
    };

    DataSource = jest
      .spyOn(typeorm, 'DataSource')
      .mockImplementation(() => mockDataSource as never) as jest.Mock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        {
          provide: DatabaseModelAction,
          useValue: mockDatabaseModelAction,
        },
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully configure database and save to .env', async () => {
      // .env doesn't exist
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.create(mockConfigureDatabaseDto);

      // Verify dataSource was created with correct config
      expect(DataSource).toHaveBeenCalledWith(
        expect.objectContaining({
          type: mockConfigureDatabaseDto.database_type,
          host: mockConfigureDatabaseDto.database_host,
          port: mockConfigureDatabaseDto.database_port,
          username: mockConfigureDatabaseDto.database_username,
          password: mockConfigureDatabaseDto.database_password,
          database: mockConfigureDatabaseDto.database_name,
          synchronize: true,
          logging: false,
          connectTimeoutMS: 10000,
        }),
      );

      // Verify connection was tested
      expect(mockDataSource.initialize).toHaveBeenCalled();
      expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
      expect(mockDataSource.destroy).toHaveBeenCalled();

      // Verify env file operations
      const envPath = join(process.cwd(), '.env');
      expect(fs.existsSync).toHaveBeenCalledWith(envPath);
      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.renameSync).toHaveBeenCalled();

      // Verify response
      expect(result).toEqual({
        message: sysMsg.DATABASE_CONFIGURATION_SUCCESS,
      });
    });

    it('should backup existing .env file before writing', async () => {
      const envPath = join(process.cwd(), '.env');
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return path === envPath;
      });
      (fs.readFileSync as jest.Mock).mockReturnValue('EXISTING_ENV_VAR=value');

      await service.create(mockConfigureDatabaseDto);

      // Verify backup was created
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        envPath,
        expect.stringContaining('.env.setup.backup.'),
      );
    });

    it('should append new config to existing .env content', async () => {
      const existingEnv = 'EXISTING_VAR=value\nOTHER_VAR=other';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(existingEnv);

      await service.create(mockConfigureDatabaseDto);

      // Verify writeFileSync was called with new config nd existing content
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenContent = writeCall[1];
      expect(writeCall[0]).toContain('.env.tmp');
      expect(writtenContent).toContain('DB_TYPE=postgres');
      expect(writtenContent).toContain('SETUP_COMPLETED');
      expect(writtenContent).toContain(existingEnv);
    });

    it('should escape special characters in env values', async () => {
      const dtoWithSpecialChars: ConfigureDatabaseDto = {
        ...mockConfigureDatabaseDto,
        database_password: 'pass with spaces',
        database_host: 'host=value',
      };

      await service.create(dtoWithSpecialChars);

      // Verify writeFileSync contains escaped values
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain('"pass with spaces"');
      expect(writtenContent).toContain('"host=value"');
    });

    it('should throw InternalServerErrorException when connection test fails', async () => {
      const connectionError = new Error('Connection refused');
      mockDataSource.initialize.mockRejectedValue(connectionError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Connection refused',
      );

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database connection failed',
        { error: connectionError },
      );

      // Verify .env was not written
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
    it('should throw InternalServerErrorException when query fails', async () => {
      const queryError = new Error('Query failed');
      mockDataSource.query.mockRejectedValue(queryError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Query failed',
      );

      // Verify connection was initialized but query failed
      expect(mockDataSource.initialize).toHaveBeenCalled();
      expect(mockDataSource.query).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException when .env write fails', async () => {
      const writeError = new Error('Permission denied');
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw writeError;
      });

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Permission denied',
      );

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to write .env file',
        { error: writeError },
      );
    });

    it('should restore backup when .env write fails', async () => {
      const envPath = join(process.cwd(), '.env');
      const backupFile = '.env.setup.backup.1234567890';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('existing content');
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });
      (fs.readdirSync as jest.Mock).mockReturnValue([backupFile, 'other.file']);

      try {
        await service.create(mockConfigureDatabaseDto);
      } catch {}

      // Verify backup restoration was attempted
      expect(fs.readdirSync).toHaveBeenCalledWith(process.cwd());
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        join(process.cwd(), backupFile),
        envPath,
      );
    });
  });
});
