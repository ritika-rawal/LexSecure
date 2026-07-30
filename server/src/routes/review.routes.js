import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  createAppointmentReview,
  getClientAppointmentReview,
  listPublicLawyerReviews,
} from '../controllers/review.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
  requireVerifiedEmail,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  appointmentReviewParamValidator,
  createReviewValidator,
  listPublicReviewsValidator,
} from '../validators/review.validator.js';

const router = Router();

router.get(
  '/appointments/:appointmentId/review',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT),
  appointmentReviewParamValidator,
  validateRequest,
  asyncHandler(getClientAppointmentReview),
);

router.post(
  '/appointments/:appointmentId/review',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT),
  requireVerifiedEmail,
  createReviewValidator,
  validateRequest,
  asyncHandler(createAppointmentReview),
);

router.get(
  '/lawyer-profiles/:profileId/reviews',
  listPublicReviewsValidator,
  validateRequest,
  asyncHandler(listPublicLawyerReviews),
);

export default router;
