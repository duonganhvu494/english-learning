import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

loadEnv();

const requiredEnv = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required to run TypeORM migrations`);
  }

  return value;
};

const parsePort = (value: string | undefined): number => {
  const port = Number.parseInt(value || '5432', 10);
  return Number.isFinite(port) ? port : 5432;
};

export default new DataSource({
  type: 'postgres',
  host: requiredEnv('DB_HOST'),
  port: parsePort(process.env.DB_PORT),
  username: requiredEnv('DB_USERNAME'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_NAME'),
  synchronize: false,
  migrationsRun: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
