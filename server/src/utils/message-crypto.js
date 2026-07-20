import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto';

import { appConfig } from '../config/app.config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;

const createAuthenticatedContext = ({
  appointmentId,
  senderId,
  recipientId,
}) =>
  Buffer.from(
    [
      appointmentId.toString(),
      senderId.toString(),
      recipientId.toString(),
    ].join(':'),
    'utf8',
  );

export const encryptMessage = ({
  message,
  appointmentId,
  senderId,
  recipientId,
}) => {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(
    ALGORITHM,
    appConfig.messageEncryptionKey,
    iv,
  );

  cipher.setAAD(
    createAuthenticatedContext({ appointmentId, senderId, recipientId }),
  );

  const encryptedBody = Buffer.concat([
    cipher.update(message, 'utf8'),
    cipher.final(),
  ]);

  return {
    encryptedBody: encryptedBody.toString('base64'),
    encryptionIv: iv.toString('base64'),
    encryptionAuthTag: cipher.getAuthTag().toString('base64'),
  };
};

export const decryptMessage = ({
  encryptedBody,
  encryptionIv,
  encryptionAuthTag,
  appointmentId,
  senderId,
  recipientId,
}) => {
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      appConfig.messageEncryptionKey,
      Buffer.from(encryptionIv, 'base64'),
    );

    decipher.setAAD(
      createAuthenticatedContext({ appointmentId, senderId, recipientId }),
    );
    decipher.setAuthTag(Buffer.from(encryptionAuthTag, 'base64'));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedBody, 'base64')),
      decipher.final(),
    ]).toString('utf8');
  } catch (cause) {
    const error = new Error('Message integrity verification failed.', {
      cause,
    });
    error.statusCode = 500;
    throw error;
  }
};
