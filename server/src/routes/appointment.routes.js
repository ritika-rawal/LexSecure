import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  createAppointment,
  listPendingLawyerAppointments,
  reviewAppointment,
} from '../controllers/appointment.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createAppointmentValidator,
  listLawyerAppointmentsValidator,
  reviewAppointmentValidator,
} from '../validators/appointment.validator.js';

const router = Router();

router.post(
  '/',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT),
  createAppointmentValidator,
  validateRequest,
  asyncHandler(createAppointment),
);

router.get(
  '/lawyer',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.LAWYER),
  listLawyerAppointmentsValidator,
  validateRequest,
  asyncHandler(listPendingLawyerAppointments),
);

router.patch(
  '/:appointmentId/decision',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.LAWYER),
  reviewAppointmentValidator,
  validateRequest,
  asyncHandler(reviewAppointment),
);

export default router;
