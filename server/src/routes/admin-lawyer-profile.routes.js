import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  listLawyerProfilesForReview,
  reviewLawyerProfile,
} from '../controllers/admin-lawyer-profile.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  listLawyerProfilesValidator,
  reviewLawyerProfileValidator,
} from '../validators/admin-lawyer-profile.validator.js';

const router = Router();

router.use(asyncHandler(requireAuthentication), authorizeRoles(USER_ROLES.ADMIN));

router.get(
  '/',
  listLawyerProfilesValidator,
  validateRequest,
  asyncHandler(listLawyerProfilesForReview),
);

router.patch(
  '/:profileId/review',
  reviewLawyerProfileValidator,
  validateRequest,
  asyncHandler(reviewLawyerProfile),
);

export default router;
