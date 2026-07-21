import { createHash, randomBytes } from 'node:crypto';

import { PASSWORD_RESET_LIMITS } from '../constants/password-reset.js';

export const generatePasswordResetToken = () =>
  randomBytes(PASSWORD_RESET_LIMITS.TOKEN_BYTES).toString('base64url');

export const hashPasswordResetToken = (token) =>
  createHash('sha256').update(token, 'utf8').digest('hex');
