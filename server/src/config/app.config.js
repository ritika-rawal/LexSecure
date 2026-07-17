import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDirectory, '../../.env');

dotenv.config({ path: envFilePath });

const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:5173';

const parsePort = (value) => {
  const parsedPort = Number.parseInt(value, 10);

  if (Number.isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    return DEFAULT_PORT;
  }

  return parsedPort;
};

const parseAllowedOrigins = (value) => {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : [DEFAULT_CLIENT_ORIGIN];
};

const nodeEnv = process.env.NODE_ENV || 'development';
const mongodbUri = process.env.MONGODB_URI;

export const appConfig = Object.freeze({
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env.PORT),
  clientOrigins: parseAllowedOrigins(process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN),
  jsonBodyLimit: '100kb',
  mongodbUri,
});
