import { Router } from 'express';

import { accountImportRateLimiter } from '../config/rate-limit.config.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { importAccountData } from '../controllers/account-import.controller.js';
import { authorizeRoles, requireAuthentication } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { accountImportValidator } from '../validators/account-import.validator.js';

const router = Router();

router.post(
  '/import',
  accountImportRateLimiter,
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER),
  accountImportValidator,
  validateRequest,
  asyncHandler(importAccountData),
);

export default router;
