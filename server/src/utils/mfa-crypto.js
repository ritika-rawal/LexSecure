import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

import { appConfig } from '../config/app.config.js';
import { MFA_LIMITS } from '../constants/mfa.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const ENCRYPTION_VERSION = 'v1';

export const encryptMfaSecret = ({ secret, userId }) => {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, appConfig.mfaEncryptionKey, iv);

  cipher.setAAD(Buffer.from(userId.toString(), 'utf8'));
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ]);

  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
};

export const decryptMfaSecret = ({ encryptedSecret, userId }) => {
  try {
    const [version, iv, authTag, ciphertext] = encryptedSecret.split('.');

    if (version !== ENCRYPTION_VERSION || !iv || !authTag || !ciphertext) {
      throw new Error('Unsupported MFA secret format.');
    }

    const decipher = createDecipheriv(
      ALGORITHM,
      appConfig.mfaEncryptionKey,
      Buffer.from(iv, 'base64url'),
    );

    decipher.setAAD(Buffer.from(userId.toString(), 'utf8'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  } catch (cause) {
    const error = new Error('MFA secret integrity verification failed.', {
      cause,
    });
    error.statusCode = 500;
    throw error;
  }
};

export const normalizeRecoveryCode = (value) =>
  value.trim().toUpperCase();

export const hashRecoveryCode = (value) =>
  createHash('sha256')
    .update(normalizeRecoveryCode(value), 'utf8')
    .digest('hex');

export const recoveryCodeHashesMatch = (firstHash, secondHash) => {
  const first = Buffer.from(firstHash, 'hex');
  const second = Buffer.from(secondHash, 'hex');

  return first.length === second.length && timingSafeEqual(first, second);
};

export const generateRecoveryCodes = () =>
  Array.from({ length: MFA_LIMITS.RECOVERY_CODE_COUNT }, () =>
    randomBytes(12)
      .toString('hex')
      .toUpperCase()
      .match(/.{1,4}/g)
      .join('-'));
