import { Router } from 'express';

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from '../controllers/auth.controller.js';
import { getCsrfToken } from '../controllers/csrf.controller.js';
import {
  csrfTokenRateLimiter,
  failedLoginRateLimiter,
  failedMfaVerificationRateLimiter,
  registrationRateLimiter,
} from '../config/rate-limit.config.js';
import { requireAuthentication } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginValidator, registerValidator } from '../validators/auth.validator.js';
import {
  disableMfaValidator,
  emptyMfaSetupValidator,
  mfaCodeValidator,
  mfaTotpValidator,
} from '../validators/mfa.validator.js';
import {
  beginMfaSetup,
  disableMfa,
  enableMfa,
  verifyMfaLogin,
} from '../controllers/mfa.controller.js';

const router = Router();

router.get('/csrf-token', csrfTokenRateLimiter, asyncHandler(getCsrfToken));
router.post(
  '/register',
  registrationRateLimiter,
  registerValidator,
  validateRequest,
  asyncHandler(registerUser),
);
router.post(
  '/login',
  failedLoginRateLimiter,
  loginValidator,
  validateRequest,
  asyncHandler(loginUser),
);
router.post(
  '/mfa/verify-login',
  failedMfaVerificationRateLimiter,
  mfaCodeValidator,
  validateRequest,
  asyncHandler(verifyMfaLogin),
);
router.post(
  '/mfa/setup',
  asyncHandler(requireAuthentication),
  emptyMfaSetupValidator,
  validateRequest,
  asyncHandler(beginMfaSetup),
);
router.post(
  '/mfa/enable',
  asyncHandler(requireAuthentication),
  mfaTotpValidator,
  validateRequest,
  asyncHandler(enableMfa),
);
router.post(
  '/mfa/disable',
  asyncHandler(requireAuthentication),
  disableMfaValidator,
  validateRequest,
  asyncHandler(disableMfa),
);
router.post('/logout', asyncHandler(logoutUser));
router.get('/me', asyncHandler(requireAuthentication), asyncHandler(getCurrentUser));

export default router;
