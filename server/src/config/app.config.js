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
const DEFAULT_PASSWORD_MAX_AGE_DAYS = 90;
const DEFAULT_PASSWORD_HISTORY_SIZE = 5;
const DEVELOPMENT_TURNSTILE_SECRET_KEY = '1x0000000000000000000000000000000AA';

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

const parseIntegerInRange = (value, defaultValue, variableName, minimum, maximum) => {
  if (value === undefined || value === '') return defaultValue;

  const parsedValue = Number.parseInt(value, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < minimum || parsedValue > maximum) {
    throw new Error(`${variableName} must be an integer between ${minimum} and ${maximum}.`);
  }

  return parsedValue;
};

const parseHostnames = (value) => {
  const hostnames = value
    .split(',')
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);

  if (
    hostnames.length === 0
    || hostnames.some((hostname) => !/^[a-z0-9.-]+$/.test(hostname))
  ) {
    throw new Error('TURNSTILE_ALLOWED_HOSTNAMES must contain valid hostnames.');
  }

  return Object.freeze(hostnames);
};

const parseTrustProxyHops = (value) => {
  if (value === undefined || value === '') return nodeEnv === 'production' ? 1 : 0;

  const hops = Number.parseInt(value, 10);

  if (!Number.isInteger(hops) || hops < 0 || hops > 2) {
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 2.');
  }

  return hops;
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
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY
  || (nodeEnv === 'production' ? null : DEVELOPMENT_TURNSTILE_SECRET_KEY);
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

if (
  !turnstileSecretKey
  || (
    nodeEnv === 'production'
    && turnstileSecretKey === DEVELOPMENT_TURNSTILE_SECRET_KEY
  )
) {
  throw new Error('A non-development TURNSTILE_SECRET_KEY is required in production.');
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
  exposeErrorDetails: parseBoolean(
    process.env.EXPOSE_ERROR_DETAILS,
    nodeEnv !== 'production',
  ),
  port: parsePort(process.env.PORT),
  trustProxyHops: parseTrustProxyHops(process.env.TRUST_PROXY_HOPS),
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
  passwordPolicy: Object.freeze({
    maxAgeDays: parseIntegerInRange(
      process.env.PASSWORD_MAX_AGE_DAYS,
      DEFAULT_PASSWORD_MAX_AGE_DAYS,
      'PASSWORD_MAX_AGE_DAYS',
      1,
      365,
    ),
    historySize: parseIntegerInRange(
      process.env.PASSWORD_HISTORY_SIZE,
      DEFAULT_PASSWORD_HISTORY_SIZE,
      'PASSWORD_HISTORY_SIZE',
      1,
      10,
    ),
  }),
  smtp,
  turnstile: Object.freeze({
    secretKey: turnstileSecretKey,
    expectedAction: 'login',
    allowedHostnames: parseHostnames(
      process.env.TURNSTILE_ALLOWED_HOSTNAMES || 'localhost,127.0.0.1',
    ),
    verificationTimeoutMs: 5_000,
    allowsDevelopmentTestResponse: nodeEnv !== 'production',
  }),
});
