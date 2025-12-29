import { join } from 'path';

import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import config from '../config/config';

dotenv.config();

const { database } = config();
const configData = config();

// Determine environment using config helper functions
const isProduction = configData.isProduction();
const isStaging = configData.isStaging();
const isDevelopment = configData.isDev();

/**
 * TypeORM DataSource configuration for CLI operations (migrations)
 * This is used by typeorm CLI commands like migration:generate, migration:run, etc.
 *
 * IMPORTANT: This configuration must match app.module.ts settings
 */
const dataSource = new DataSource({
  type: 'postgres',
  host: database.host,
  port: database.port || parseInt('5432'),
  username: database.user,
  password: database.pass || 'postgres',
  database: database.name,

  /**
   * Entity paths for migration generation
   * Uses join() for cross-platform compatibility
   * Looks in src/modules for .ts files (dev) or dist/modules for .js files (prod)
   */
  entities: [
    join(__dirname, '..', 'modules', '**', '*.entity.{ts,js}'),
    join(__dirname, '..', 'modules', '**', 'entities', '*.entity.{ts,js}'),
  ],

  /**
   * Migration files location
   * Works in both development (TypeScript) and production (JavaScript)
   */
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],

  /**
   * CRITICAL: Disable synchronize in production
   * Schema changes MUST go through migrations in production
   */
  synchronize: isDevelopment,

  /**
   * Run migrations automatically on application start
   * Only in production/staging environments
   */
  migrationsRun: isProduction || isStaging,

  /**
   * Custom migrations table name
   */
  migrationsTableName: 'migrations',

  /**
   * SSL configuration for production databases
   */
  ssl: database.ssl ? { rejectUnauthorized: false } : false,

  /**
   * Logging configuration
   * Development: log everything
   * Production: only errors, warnings, and migration info
   */
  logging: isDevelopment ? true : ['error', 'warn', 'migration'],
});

export async function initializeDataSource() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export default dataSource;
