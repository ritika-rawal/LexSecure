import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  listAppointmentMessages,
  sendAppointmentMessage,
} from '../controllers/message.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  listMessagesValidator,
  sendMessageValidator,
} from '../validators/message.validator.js';

const router = Router();

router.post(
  '/appointments/:appointmentId/messages',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER),
  sendMessageValidator,
  validateRequest,
  asyncHandler(sendAppointmentMessage),
);

router.get(
  '/appointments/:appointmentId/messages',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER),
  listMessagesValidator,
  validateRequest,
  asyncHandler(listAppointmentMessages),
);

export default router;
