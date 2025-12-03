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
interface IDatabaseError extends Error {
  code?: string;
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

    it('should replace existing auto-generated config block when it exists', async () => {
      const envPath = join(process.cwd(), '.env');
      const existingEnv = `# Database Configuration (Auto-generated by setup)
          DB_TYPE=old_postgres
          DB_HOST=oldhost
          DB_PORT=5432
          DB_USER=olduser
          DB_PASS=oldpass
          DB_NAME=olddb
          SETUP_COMPLETED='true'

          NODE_ENV=development
          PORT=3000
          DB_HOST=localhost
          DB_PORT=5432`;
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return path === envPath;
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(existingEnv);

      await service.create(mockConfigureDatabaseDto);

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenContent = writeCall[1];
      // Verify new config replaced old auto-generated block
      expect(writtenContent).toContain('DB_HOST=localhost'); // new value
      expect(writtenContent).not.toContain('DB_HOST=oldhost'); // old value removed
      expect(writtenContent).not.toContain('DB_NAME=olddb'); // old value removed

      // Verify manual DB credentials below are preserved
      expect(writtenContent).toContain('NODE_ENV=development');
      expect(writtenContent).toContain('PORT=3000');
      expect(writtenContent).toContain('DB_HOST=localhost'); // manual one preserved
      expect(writtenContent).toContain('DB_PORT=5432'); // manual one preserved
    });

    it('should prepend new config when no auto-generated block exists', async () => {
      const existingEnv = 'NODE_ENV=development\nPORT=3000\nDB_HOST=localhost';
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(existingEnv);

      await service.create(mockConfigureDatabaseDto);

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenContent = writeCall[1];
      expect(writeCall[0]).toContain('.env.tmp');
      expect(writtenContent).toContain('DB_TYPE=postgres');
      expect(writtenContent).toContain('SETUP_COMPLETED');
      expect(writtenContent).toContain(existingEnv);
      // Verify new config comes before existing content
      const newConfigIndex = writtenContent.indexOf('DB_TYPE=postgres');
      const existingEnvIndex = writtenContent.indexOf('NODE_ENV=development');
      expect(newConfigIndex).toBeLessThan(existingEnvIndex);
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

    it('should throw BadRequestException when connection test fails', async () => {
      const connectionError = new Error('Connection refused') as IDatabaseError;
      connectionError.code = 'ECONNREFUSED'; // Add error code
      mockDataSource.initialize.mockRejectedValue(connectionError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Cannot connect to database host', // Updated expectation
      );

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database connection failed',
        { error: connectionError },
      );

      // Verify .env was not written
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid credentials', async () => {
      const authError = new Error(
        'password authentication failed',
      ) as IDatabaseError;
      authError.code = '28P01';
      mockDataSource.initialize.mockRejectedValue(authError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Invalid database credentials',
      );
    });

    it('should throw BadRequestException when database does not exist', async () => {
      const dbError = new Error(
        'database "test_db" does not exist',
      ) as IDatabaseError;
      dbError.code = '3D000';
      mockDataSource.initialize.mockRejectedValue(dbError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'does not exist. Please create it first',
      );
    });

    it('should throw BadRequestException for role does not exist', async () => {
      const roleError = new Error(
        'role "root" does not exist',
      ) as IDatabaseError;
      roleError.code = '28000';
      mockDataSource.initialize.mockRejectedValue(roleError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Invalid database credentials',
      );
    });

    it('should throw InternalServerErrorException when query fails', async () => {
      const queryError = new Error('Query failed');

      mockDataSource.query.mockRejectedValue(queryError);

      await expect(service.create(mockConfigureDatabaseDto)).rejects.toThrow(
        'Failed to connect to database. Please check your configuration.', // Updated expectation
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

    it('should return DATABASE_CONFIGURATION_UPDATED when setup was already completed', async () => {
      const envPath = join(process.cwd(), '.env');

      // .env exists and contains SETUP_COMPLETED=true
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return path === envPath;
      });
      (fs.readFileSync as jest.Mock).mockReturnValue(
        'SETUP_COMPLETED=true\nDB_TYPE=postgres',
      );

      const result = await service.create(mockConfigureDatabaseDto);

      expect(result).toEqual({
        message: sysMsg.DATABASE_CONFIGURATION_UPDATED,
      });
    });

    it('should return DATABASE_CONFIGURATION_SUCCESS when .env exists but setup was not completed', async () => {
      const envPath = join(process.cwd(), '.env');

      // .env exists but doesn't have SETUP_COMPLETED=true
      (fs.existsSync as jest.Mock).mockImplementation((path) => {
        return path === envPath;
      });
      (fs.readFileSync as jest.Mock).mockReturnValue('SOME_OTHER_VAR=value');

      const result = await service.create(mockConfigureDatabaseDto);

      expect(result).toEqual({
        message: sysMsg.DATABASE_CONFIGURATION_SUCCESS,
      });
    });
  });

  describe('update', () => {
    it('should throw BadRequestException if setup is not completed', async () => {
      // Mock .env doesn't exist or SETUP_COMPLETED is false
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.update(mockConfigureDatabaseDto)).rejects.toThrow(
        'Initial setup must be completed first before updating configuration.',
      );

      // Verify no connection test or file write was attempted
      expect(DataSource).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if SETUP_COMPLETED is false', async () => {
      const envPath = join(process.cwd(), '.env');
      (fs.existsSync as jest.Mock).mockImplementation(
        (path) => path === envPath,
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(
        "SETUP_COMPLETED='false'\nDB_HOST=localhost",
      );

      await expect(service.update(mockConfigureDatabaseDto)).rejects.toThrow(
        'Initial setup must be completed first before updating configuration.',
      );
    });

    it('should replace existing auto-generated block with new credentials', async () => {
      const envPath = join(process.cwd(), '.env');
      const existingEnv = `# Database Configuration (Auto-generated by setup)
        DB_TYPE=postgres
        DB_HOST=oldhost
        DB_PORT=5432
        DB_USER=olduser
        DB_PASS=oldpass
        DB_NAME=olddb
        SETUP_COMPLETED='true'
            
        NODE_ENV=development
        DB_HOST=localhost
        DB_PORT=5432`;

      (fs.existsSync as jest.Mock).mockImplementation(
        (path) => path === envPath,
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(existingEnv);

      const newConfig: ConfigureDatabaseDto = {
        database_name: 'new_database',
        database_type: DatabaseType.MYSQL,
        database_host: 'newhost',
        database_username: 'newuser',
        database_port: 3306,
        database_password: 'newpass123',
      };
      await service.update(newConfig);

      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenContent = writeCall[1];

      // Verify new config replaced old auto-generated block
      expect(writtenContent).toContain('DB_HOST=newhost');
      expect(writtenContent).toContain('DB_PORT=3306');
      expect(writtenContent).toContain('DB_USER=newuser');
      expect(writtenContent).toContain('DB_NAME=new_database');
      expect(writtenContent).toContain('DB_TYPE=mysql');
      expect(writtenContent).not.toContain('DB_HOST=oldhost');
      expect(writtenContent).not.toContain('DB_NAME=olddb');

      // Verify manual DB credentials are preserved
      expect(writtenContent).toContain('NODE_ENV=development');
      expect(writtenContent).toContain('DB_HOST=localhost'); // manual one
      expect(writtenContent).toContain('DB_PORT=5432'); // manual one
    });

    it('should throw BadRequestException when new database connection test fails', async () => {
      const envPath = join(process.cwd(), '.env');
      (fs.existsSync as jest.Mock).mockImplementation(
        (path) => path === envPath,
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(
        "SETUP_COMPLETED='true'\nDB_HOST=localhost",
      );

      const connectionError = new Error('Connection refused') as IDatabaseError;
      connectionError.code = 'ECONNREFUSED';
      mockDataSource.initialize.mockRejectedValue(connectionError);

      await expect(service.update(mockConfigureDatabaseDto)).rejects.toThrow(
        'Cannot connect to database host',
      );

      // Verify error was logged
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Database connection failed',
        { error: connectionError },
      );

      // Verify config was not saved (writeFileSync should only be called once for backup, not for actual write)
      expect(fs.renameSync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid new credentials during update', async () => {
      const envPath = join(process.cwd(), '.env');
      (fs.existsSync as jest.Mock).mockImplementation(
        (path) => path === envPath,
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(
        "SETUP_COMPLETED='true'\nDB_HOST=localhost",
      );

      const authError = new Error(
        'password authentication failed',
      ) as IDatabaseError;
      authError.code = '28P01';
      mockDataSource.initialize.mockRejectedValue(authError);

      await expect(service.update(mockConfigureDatabaseDto)).rejects.toThrow(
        'Invalid database credentials',
      );
    });

    it('should restore backup if update write fails', async () => {
      const envPath = join(process.cwd(), '.env');
      const backupFile = '.env.setup.backup.1234567890';

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(
        "SETUP_COMPLETED='true'\nDB_HOST=localhost",
      );
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });
      (fs.readdirSync as jest.Mock).mockReturnValue([backupFile]);

      try {
        await service.update(mockConfigureDatabaseDto);
      } catch {}

      // Verify backup restoration was attempted
      expect(fs.readdirSync).toHaveBeenCalledWith(process.cwd());
      expect(fs.copyFileSync).toHaveBeenCalledWith(
        join(process.cwd(), backupFile),
        envPath,
      );
    });

    it('should preserve SETUP_COMPLETED=true after update', async () => {
      const envPath = join(process.cwd(), '.env');
      (fs.existsSync as jest.Mock).mockImplementation(
        (path) => path === envPath,
      );
      (fs.readFileSync as jest.Mock).mockReturnValue(
        "SETUP_COMPLETED='true'\nOTHER_VAR=value",
      );

      await service.update(mockConfigureDatabaseDto);

      // Verify SETUP_COMPLETED remains true
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain("SETUP_COMPLETED='true'");
    });
  });
});
