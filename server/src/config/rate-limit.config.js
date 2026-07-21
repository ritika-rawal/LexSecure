import { rateLimit } from 'express-rate-limit';

import {
  RATE_LIMIT_ERROR_CODE,
  RATE_LIMIT_MAXIMUMS,
  RATE_LIMIT_WINDOWS_MS,
} from '../constants/authentication-security.js';

const createRateLimiter = ({
  limit,
  message,
  skipSuccessfulRequests = false,
  windowMs,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    passOnStoreError: false,
    handler(req, res, next, options) {
      res.set('Cache-Control', 'private, no-store');
      res.status(options.statusCode).json({
        status: 'error',
        code: RATE_LIMIT_ERROR_CODE,
        message,
      });
    },
  });

export const apiRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOWS_MS.API,
  limit: RATE_LIMIT_MAXIMUMS.API,
  message: 'Too many API requests. Try again later.',
});

export const csrfTokenRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOWS_MS.AUTHENTICATION,
  limit: RATE_LIMIT_MAXIMUMS.CSRF_TOKEN,
  message: 'Too many security-token requests. Try again later.',
});

export const failedLoginRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOWS_MS.AUTHENTICATION,
  limit: RATE_LIMIT_MAXIMUMS.FAILED_LOGIN,
  message: 'Too many login attempts. Try again later.',
  skipSuccessfulRequests: true,
});

export const registrationRateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOWS_MS.REGISTRATION,
  limit: RATE_LIMIT_MAXIMUMS.REGISTRATION,
  message: 'Too many registration attempts. Try again later.',
});
