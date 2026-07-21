import dotenv from 'dotenv';
import { hkdfSync } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const envFilePath = resolve(currentDirectory, '../../.env');

dotenv.config({ path: envFilePath });

const DEFAULT_PORT = 5000;
const DEFAULT_CLIENT_ORIGIN = 'http://localhost:3000';
const DEFAULT_PASSWORD_RESET_URL = `${DEFAULT_CLIENT_ORIGIN}/reset-password`;

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

const parseBoolean = (value, defaultValue) => {
  if (value === undefined || value === '') return defaultValue;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error('Boolean environment values must be either true or false.');
};

const parseHttpUrl = (value, variableName) => {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid absolute URL.`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${variableName} must use HTTP or HTTPS.`);
  }

  return url.toString();
};

const parseSmtpConfig = () => {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.SMTP_FROM?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const hasAnyValue = [host, from, user, password]
    .some((value) => Boolean(value));

  if (!hasAnyValue) return null;

  const port = Number.parseInt(process.env.SMTP_PORT, 10);

  if (!host || !from || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_HOST, SMTP_PORT, and SMTP_FROM must be configured correctly.');
  }

  if (Boolean(user) !== Boolean(password)) {
    throw new Error('SMTP_USER and SMTP_PASSWORD must be provided together.');
  }

  return Object.freeze({
    host,
    port,
    from,
    user: user || null,
    password: password || null,
    secure: parseBoolean(process.env.SMTP_SECURE, port === 465),
    requireTls: parseBoolean(process.env.SMTP_REQUIRE_TLS, true),
  });
};

const nodeEnv = process.env.NODE_ENV || 'development';
const mongodbUri = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;
const documentEncryptionKey = process.env.DOCUMENT_ENCRYPTION_KEY;
const messageEncryptionKey = process.env.MESSAGE_ENCRYPTION_KEY;
const auditLogHmacKey = process.env.AUDIT_LOG_HMAC_KEY;
const mfaEncryptionKey = process.env.MFA_ENCRYPTION_KEY;
const passwordResetUrl = parseHttpUrl(
  process.env.PASSWORD_RESET_URL || DEFAULT_PASSWORD_RESET_URL,
  'PASSWORD_RESET_URL',
);
const smtp = parseSmtpConfig();

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

const parsedAuditLogHmacKey = parseEncryptionKey(
  auditLogHmacKey,
  'AUDIT_LOG_HMAC_KEY',
);

if (nodeEnv === 'production' && !mfaEncryptionKey) {
  throw new Error('MFA_ENCRYPTION_KEY is required in production.');
}

if (nodeEnv === 'production' && !smtp) {
  throw new Error('SMTP configuration is required in production.');
}

if (nodeEnv === 'production' && !passwordResetUrl.startsWith('https://')) {
  throw new Error('PASSWORD_RESET_URL must use HTTPS in production.');
}

const resolvedMfaEncryptionKey = mfaEncryptionKey
  ? parseEncryptionKey(mfaEncryptionKey, 'MFA_ENCRYPTION_KEY')
  : Buffer.from(
      hkdfSync(
        'sha256',
        parsedAuditLogHmacKey,
        Buffer.from('lexsecure-mfa-salt-v1', 'utf8'),
        Buffer.from('lexsecure-mfa-encryption-v1', 'utf8'),
        32,
      ),
    );

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
  auditLogHmacKey: parsedAuditLogHmacKey,
  mfaEncryptionKey: resolvedMfaEncryptionKey,
  passwordResetUrl,
  smtp,
});
