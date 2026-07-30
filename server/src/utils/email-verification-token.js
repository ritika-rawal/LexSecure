import { createHash, randomBytes } from 'node:crypto';

import { EMAIL_VERIFICATION_LIMITS } from '../constants/email-verification.js';

export const generateEmailVerificationToken = () =>
  randomBytes(EMAIL_VERIFICATION_LIMITS.TOKEN_BYTES).toString('base64url');

export const hashEmailVerificationToken = (token) =>
  createHash('sha256').update(token, 'utf8').digest('hex');
