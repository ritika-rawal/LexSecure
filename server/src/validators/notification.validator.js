import { param, query } from 'express-validator';

const ALLOWED_NOTIFICATION_QUERY_FIELDS = new Set([
  'unreadOnly',
  'page',
  'limit',
]);

export const listNotificationsValidator = [
  query().custom((queryParameters) => {
    const containsOnlyAllowedFields = Object.keys(queryParameters).every((key) =>
      ALLOWED_NOTIFICATION_QUERY_FIELDS.has(key),
    );

    if (!containsOnlyAllowedFields) {
      throw new Error('Request contains unsupported query parameters.');
    }

    return true;
  }),
  query('unreadOnly')
    .optional()
    .isBoolean({ strict: true })
    .withMessage('Unread-only filter must be true or false.')
    .toBoolean(),
  query('page')
    .optional()
    .isInt({ min: 1, max: 10_000 })
    .withMessage('Page must be between 1 and 10000.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50.')
    .toInt(),
];

export const markNotificationReadValidator = [
  param('notificationId')
    .isMongoId()
    .withMessage('Notification ID must be a valid MongoDB identifier.'),
];
