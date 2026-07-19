export const buildSafeNotificationResponse = (notification) =>
  Object.freeze({
    id: notification.id,
    appointmentId: notification.appointment.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: Boolean(notification.readAt),
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  });
