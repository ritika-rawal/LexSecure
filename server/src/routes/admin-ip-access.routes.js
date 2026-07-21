import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  createIpAccessRule,
  deleteIpAccessRule,
  listIpAccessRules,
  updateIpAccessRule,
} from '../controllers/admin-ip-access.controller.js';
import { authorizeRoles, requireAuthentication } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createIpAccessRuleValidator,
  deleteIpAccessRuleValidator,
  updateIpAccessRuleValidator,
} from '../validators/admin-ip-access.validator.js';

const router = Router();

router.use(asyncHandler(requireAuthentication), authorizeRoles(USER_ROLES.ADMIN));

router.get('/', asyncHandler(listIpAccessRules));
router.post(
  '/',
  createIpAccessRuleValidator,
  validateRequest,
  asyncHandler(createIpAccessRule),
);
router.patch(
  '/:ruleId',
  updateIpAccessRuleValidator,
  validateRequest,
  asyncHandler(updateIpAccessRule),
);
router.delete(
  '/:ruleId',
  deleteIpAccessRuleValidator,
  validateRequest,
  asyncHandler(deleteIpAccessRule),
);

export default router;
