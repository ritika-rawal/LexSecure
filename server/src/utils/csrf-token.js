import { randomBytes, timingSafeEqual } from 'node:crypto';

import {
  CSRF_TOKEN_BYTES,
  CSRF_TOKEN_PATTERN,
} from '../constants/csrf.js';

export const getOrCreateCsrfToken = (session) => {
  if (
    typeof session.csrfToken !== 'string'
    || !CSRF_TOKEN_PATTERN.test(session.csrfToken)
  ) {
    session.csrfToken = randomBytes(CSRF_TOKEN_BYTES).toString('base64url');
  }

  return session.csrfToken;
};

export const csrfTokensMatch = (providedToken, expectedToken) => {
  if (
    typeof providedToken !== 'string'
    || typeof expectedToken !== 'string'
    || !CSRF_TOKEN_PATTERN.test(providedToken)
    || !CSRF_TOKEN_PATTERN.test(expectedToken)
  ) {
    return false;
  }

  const providedBuffer = Buffer.from(providedToken, 'ascii');
  const expectedBuffer = Buffer.from(expectedToken, 'ascii');

  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
};
