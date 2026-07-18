import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  createLawyerProfile,
  getCurrentLawyerProfile,
  updateCurrentLawyerProfile,
} from '../controllers/lawyer-profile.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createLawyerProfileValidator,
  updateLawyerProfileValidator,
} from '../validators/lawyer-profile.validator.js';

const router = Router();

router.get(
  '/me',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.LAWYER),
  asyncHandler(getCurrentLawyerProfile),
);

router.patch(
  '/me',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.LAWYER),
  updateLawyerProfileValidator,
  validateRequest,
  asyncHandler(updateCurrentLawyerProfile),
);

router.post(
  '/',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.LAWYER),
  createLawyerProfileValidator,
  validateRequest,
  asyncHandler(createLawyerProfile),
);

export default router;
