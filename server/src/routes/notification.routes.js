import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  getUnreadNotificationCount,
  listNotifications,
  markNotificationAsRead,
} from '../controllers/notification.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  listNotificationsValidator,
  markNotificationReadValidator,
} from '../validators/notification.validator.js';

const router = Router();
const participantRoles = [USER_ROLES.CLIENT, USER_ROLES.LAWYER];

router.use(
  asyncHandler(requireAuthentication),
  authorizeRoles(...participantRoles),
);

router.get(
  '/',
  listNotificationsValidator,
  validateRequest,
  asyncHandler(listNotifications),
);

router.get(
  '/unread-count',
  asyncHandler(getUnreadNotificationCount),
);

router.patch(
  '/:notificationId/read',
  markNotificationReadValidator,
  validateRequest,
  asyncHandler(markNotificationAsRead),
);

export default router;
