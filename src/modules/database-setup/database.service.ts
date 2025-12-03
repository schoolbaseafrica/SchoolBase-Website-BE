import * as fs from 'fs';
import { join } from 'path';

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from 'winston';

import * as sysMsg from '../../constants/system.messages';

import { ConfigureDatabaseDto } from './dto/configure-database.dto';
import { DatabaseModelAction } from './model-actions/database-actions';

@Injectable()
export class DatabaseService {
  private readonly logger: Logger;
  constructor(
    private readonly databaseModelAction: DatabaseModelAction,
    @Inject(WINSTON_MODULE_PROVIDER) baseLogger: Logger,
  ) {
    this.logger = baseLogger.child({ context: DatabaseService.name });
  }

  //===> configure school database <====
  async create(configureDatabaseDto: ConfigureDatabaseDto) {
    // Check if setup has already been done
    const isUpdate = this.checkSetupCompleted();

    // test connection & auto-create tables
    const testConnectionResult =
      await this.testConnectionAndCreateTables(configureDatabaseDto);
    if (!testConnectionResult) {
      this.logger.error(`Attempt to connect and create database failed`);
      throw new InternalServerErrorException(
        sysMsg.DATABASE_CONFIGURATION_FAILED,
      );
    }

    // Save or update credentials to .env file
    let saveConfigResult: boolean;
    if (isUpdate) {
      saveConfigResult = await this.updateConfigInFile(configureDatabaseDto);
    } else {
      saveConfigResult = await this.saveConfigToFile(configureDatabaseDto);
    }
    if (!saveConfigResult) {
      this.logger.error(`Attempt to save database configuration failed`);
      throw new InternalServerErrorException(sysMsg.INTERNAL_SERVER_ERROR);
    }

    return {
      message: isUpdate
        ? sysMsg.DATABASE_CONFIGURATION_UPDATED
        : sysMsg.DATABASE_CONFIGURATION_SUCCESS,
    };
  }

  // Update configuration
  async update(configureDatabaseDto: ConfigureDatabaseDto) {
    if (!this.checkSetupCompleted()) {
      throw new BadRequestException(
        'Initial setup must be completed first before updating configuration.',
      );
    }

    // Test new connection
    await this.testConnectionAndCreateTables(configureDatabaseDto);

    // Update config in file
    await this.updateConfigInFile(configureDatabaseDto);

    return {
      message: sysMsg.DATABASE_CONFIGURATION_UPDATED,
    };
  }

  private async testConnectionAndCreateTables(
    configureDatabaseDto: ConfigureDatabaseDto,
  ) {
    const tempDataSource: DataSource | null = null;

    try {
      const tempDataSource = new DataSource({
        type: configureDatabaseDto.database_type,
        host: configureDatabaseDto.database_host,
        port: configureDatabaseDto.database_port,
        username: configureDatabaseDto.database_username,
        password: configureDatabaseDto.database_password,
        database: configureDatabaseDto.database_name,
        entities: [join(process.cwd(), 'dist', '**', '*.entity.js')],
        synchronize: true,
        logging: false,
        connectTimeoutMS: 10000,
      } as DataSourceOptions);

      // Initialize connection
      await tempDataSource.initialize();
      // Verify connection
      await tempDataSource.query('SELECT 1');
      // Close the temporary connection
      await tempDataSource.destroy();

      return true;
    } catch (error) {
      this.logger.error('Database connection failed', { error });
      // Transform database errors to client-friendly messages
      const errorCode = error?.code;
      const errorMessage = error?.message || '';

      if (errorCode === '28P01' || errorCode === '28000') {
        // auth failed or invalid credentials
        throw new BadRequestException(
          'Invalid database credentials. Please check username and password.',
        );
      } else if (errorCode === '3D000') {
        // db does not exist
        throw new BadRequestException(
          `Database "${configureDatabaseDto.database_name}" does not exist. Please create it first.`,
        );
      } else if (errorCode === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        // connection refused or host not found
        throw new BadRequestException(
          `Cannot connect to database host "${configureDatabaseDto.database_host}:${configureDatabaseDto.database_port}". Please verify the host and port.`,
        );
      } else if (errorCode === 'ETIMEDOUT') {
        throw new BadRequestException(
          'Database connection timeout. Please check your network or firewall settings.',
        );
      } else if (errorMessage.includes('does not exist')) {
        throw new BadRequestException(errorMessage.replace('error: ', ''));
      } else {
        // Unknown error
        throw new InternalServerErrorException(
          'Failed to connect to database. Please check your configuration.',
        );
      }
    } finally {
      if (tempDataSource?.isInitialized) {
        await tempDataSource.destroy();
      }
    }
  }

  // add new config to existing .env
  private async saveConfigToFile(configureDatabaseDto: ConfigureDatabaseDto) {
    const envPath = join(process.cwd(), '.env');
    // Backup existing .env
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, `${envPath}.setup.backup.${Date.now()}`);
    }
    const escapeEnvValue = (value: string) => {
      if (value.includes(' ') || value.includes('=') || value.includes('"')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    };
    try {
      // Read existing .env content if it exists
      let existingEnv = '';
      if (fs.existsSync(envPath)) {
        existingEnv = fs.readFileSync(envPath, 'utf8');
      }
      // Prepare new DB configuration
      const dbConfig = `# Database Configuration (Auto-generated by setup)
DB_TYPE=${escapeEnvValue(configureDatabaseDto.database_type)}
DB_HOST=${escapeEnvValue(configureDatabaseDto.database_host)}
DB_PORT=${configureDatabaseDto.database_port}
DB_USER=${escapeEnvValue(configureDatabaseDto.database_username)}
DB_PASS=${escapeEnvValue(configureDatabaseDto.database_password)}
DB_NAME=${escapeEnvValue(configureDatabaseDto.database_name)}
SETUP_COMPLETED='true'`;

      // Atomic write (write to temp, then rename)
      const tempPath = `${envPath}.tmp`;
      fs.writeFileSync(tempPath, dbConfig + '\n\n' + existingEnv);
      fs.renameSync(tempPath, envPath);
      return true;
    } catch (error) {
      this.logger.error('Failed to write .env file', { error });
      this.restoreBackup(envPath);
      throw error;
    }
  }

  // replace existing auto-generated block
  private async updateConfigInFile(configureDatabaseDto: ConfigureDatabaseDto) {
    const envPath = join(process.cwd(), '.env');

    // Backup existing .env
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, `${envPath}.setup.backup.${Date.now()}`);
    }

    const escapeEnvValue = (value: string) => {
      if (value.includes(' ') || value.includes('=') || value.includes('"')) {
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    };

    try {
      const existingEnv = fs.readFileSync(envPath, 'utf8');

      // Prepare new DB configuration
      const dbConfig = `# Database Configuration (Auto-generated by setup)
DB_TYPE=${escapeEnvValue(configureDatabaseDto.database_type)}
DB_HOST=${escapeEnvValue(configureDatabaseDto.database_host)}
DB_PORT=${configureDatabaseDto.database_port}
DB_USER=${escapeEnvValue(configureDatabaseDto.database_username)}
DB_PASS=${escapeEnvValue(configureDatabaseDto.database_password)}
DB_NAME=${escapeEnvValue(configureDatabaseDto.database_name)}
SETUP_COMPLETED='true'`;

      // Regex to match the auto-generated database configuration block
      const autoGeneratedBlockRegex =
        /#\s*Database Configuration\s*\(Auto-generated by setup\)[\s\S]*?SETUP_COMPLETED\s*=\s*['"]?true['"]?\s*/i;

      // Replace existing auto-generated database configuration block
      const finalEnvContent = existingEnv.replace(
        autoGeneratedBlockRegex,
        dbConfig + '\n\n',
      );

      // Atomic write (write to temp, then rename)
      const tempPath = `${envPath}.tmp`;
      fs.writeFileSync(tempPath, finalEnvContent);
      fs.renameSync(tempPath, envPath);
      return true;
    } catch (error) {
      this.logger.error('Failed to update .env file', { error });
      this.restoreBackup(envPath);
      throw error;
    }
  }

  //===> check if setup is already completed <====
  private checkSetupCompleted(): boolean {
    const envPath = join(process.cwd(), '.env');

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const setupCompletedRegex = /SETUP_COMPLETED\s*=\s*['"]?true['"]?/i;
      return setupCompletedRegex.test(envContent);
    }

    return false;
  }
  // Helper to restore backup on failure
  private restoreBackup(envPath: string) {
    const backups = fs
      .readdirSync(process.cwd())
      .filter((f) => f.startsWith('.env.setup.backup.'))
      .sort()
      .reverse();
    if (backups.length > 0) {
      fs.copyFileSync(join(process.cwd(), backups[0]), envPath);
    }
  }
}
