import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { appConfig } from '../config/app.config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

export const encryptDocument = (plainBuffer) => {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(
    ALGORITHM,
    appConfig.documentEncryptionKey,
    iv,
  );
  const encryptedBuffer = Buffer.concat([
    cipher.update(plainBuffer),
    cipher.final(),
  ]);

  return {
    encryptedBuffer,
    encryptionIv: iv.toString('base64'),
    encryptionAuthTag: cipher.getAuthTag().toString('base64'),
    contentHash: createHash('sha256').update(plainBuffer).digest('hex'),
  };
};

export const decryptDocument = ({
  encryptedBuffer,
  encryptionIv,
  encryptionAuthTag,
  expectedContentHash,
}) => {
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      appConfig.documentEncryptionKey,
      Buffer.from(encryptionIv, 'base64'),
    );

    decipher.setAuthTag(Buffer.from(encryptionAuthTag, 'base64'));

    const plainBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);
    const actualContentHash = createHash('sha256')
      .update(plainBuffer)
      .digest('hex');

    if (actualContentHash !== expectedContentHash) {
      throw new Error('Document content hash does not match.');
    }

    return plainBuffer;
  } catch (cause) {
    // Treat altered ciphertext, metadata, or keys as one controlled failure.
    const error = new Error('Document integrity verification failed.', {
      cause,
    });
    error.statusCode = 500;
    throw error;
  }
};
