import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import { listAuditLogs } from '../controllers/admin-audit.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { listAuditLogsValidator } from '../validators/admin-audit.validator.js';

const router = Router();

router.use(
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.ADMIN),
);

router.get(
  '/',
  listAuditLogsValidator,
  validateRequest,
  asyncHandler(listAuditLogs),
);

export default router;
