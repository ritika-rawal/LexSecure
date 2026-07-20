import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDirectory, '../../.env');

dotenv.config({ path: envFilePath });

const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:3000';

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
const sessionSecret = process.env.SESSION_SECRET;
const documentEncryptionKey = process.env.DOCUMENT_ENCRYPTION_KEY;
const messageEncryptionKey = process.env.MESSAGE_ENCRYPTION_KEY;
const auditLogHmacKey = process.env.AUDIT_LOG_HMAC_KEY;

const parseEncryptionKey = (value, variableName) => {
  if (!value) {
    throw new Error(`${variableName} is required.`);
  }

  const key = Buffer.from(value, 'base64');

  if (key.length !== 32 || key.toString('base64') !== value) {
    throw new Error(
      `${variableName} must be exactly 32 random bytes encoded as base64.`,
    );
  }

  return key;
};

export const appConfig = Object.freeze({
  env: nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parsePort(process.env.PORT),
  clientOrigins: parseAllowedOrigins(process.env.CLIENT_ORIGIN || DEFAULT_CLIENT_ORIGIN),
  jsonBodyLimit: '100kb',
  mongodbUri,
  sessionSecret,
  sessionMaxAgeMs: 1000 * 60 * 60,
  documentEncryptionKey: parseEncryptionKey(
    documentEncryptionKey,
    'DOCUMENT_ENCRYPTION_KEY',
  ),
  messageEncryptionKey: parseEncryptionKey(
    messageEncryptionKey,
    'MESSAGE_ENCRYPTION_KEY',
  ),
  auditLogHmacKey: parseEncryptionKey(
    auditLogHmacKey,
    'AUDIT_LOG_HMAC_KEY',
  ),
});
