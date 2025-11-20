import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';

import config from '../config/config';

dotenv.config();

const { database } = config();
const dataSource = new DataSource({
  type: 'postgres',
  host: database.host,
  port: database.port || parseInt('5432'),
  username: database.user,
  password: database.pass || 'postgres',
  database: database.user,
  entities: [__dirname + '/**/*.entity.{ts,js}'],
  migrations: [],
  synchronize: true,
  migrationsRun: false,
  migrationsTableName: 'migrations',
  ssl: database.ssl === false,
});

export async function initializeDataSource() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export default dataSource;
