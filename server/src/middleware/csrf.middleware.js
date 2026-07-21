import {
  CSRF_ERROR_CODE,
  CSRF_HEADER_NAME,
  CSRF_SAFE_METHODS,
} from '../constants/csrf.js';
import { csrfTokensMatch } from '../utils/csrf-token.js';

const createCsrfError = () => {
  const error = new Error('CSRF token is missing or invalid.');
  error.statusCode = 403;
  error.publicCode = CSRF_ERROR_CODE;
  return error;
};

export const csrfProtectionMiddleware = (req, res, next) => {
  if (CSRF_SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const providedToken = req.get(CSRF_HEADER_NAME);
  const expectedToken = req.session?.csrfToken;

  // Constant-time comparison avoids exposing token-prefix information.
  if (!csrfTokensMatch(providedToken, expectedToken)) {
    next(createCsrfError());
    return;
  }

  next();
};
