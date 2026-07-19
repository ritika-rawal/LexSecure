import {
  countUnreadNotifications as countUnreadNotificationsService,
  listNotifications as listNotificationsService,
  markNotificationAsRead as markNotificationAsReadService,
} from '../services/notification.service.js';
import { buildSafeNotificationResponse } from '../utils/safe-notification.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const listNotifications = async (req, res) => {
  const result = await listNotificationsService({
    recipientId: req.user.id,
    unreadOnly: req.query.unreadOnly || false,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || DEFAULT_LIMIT,
  });

  res.status(200).json({
    status: 'success',
    data: {
      notifications: result.notifications.map(buildSafeNotificationResponse),
      pagination: result.pagination,
    },
  });
};

export const getUnreadNotificationCount = async (req, res) => {
  const unreadCount = await countUnreadNotificationsService(req.user.id);

  res.status(200).json({
    status: 'success',
    data: {
      unreadCount,
    },
  });
};

export const markNotificationAsRead = async (req, res) => {
  const notification = await markNotificationAsReadService({
    recipientId: req.user.id,
    notificationId: req.params.notificationId,
  });

  res.status(200).json({
    status: 'success',
    data: {
      notification: buildSafeNotificationResponse(notification),
    },
  });
};
