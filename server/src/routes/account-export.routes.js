import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import { downloadAccountExport } from '../controllers/account-export.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { accountExportValidator } from '../validators/account-export.validator.js';

const router = Router();

router.get(
  '/export',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER),
  accountExportValidator,
  validateRequest,
  asyncHandler(downloadAccountExport),
);

export default router;
