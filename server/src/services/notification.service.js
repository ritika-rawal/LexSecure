import { NOTIFICATION_TYPES } from '../constants/notification.js';
import { Notification } from '../models/Notification.model.js';

const NOTIFICATION_CONTENT = Object.freeze({
  [NOTIFICATION_TYPES.APPOINTMENT_CREATED]: Object.freeze({
    title: 'New appointment request',
    message: 'A client submitted a consultation request for your review.',
  }),
  [NOTIFICATION_TYPES.APPOINTMENT_APPROVED]: Object.freeze({
    title: 'Appointment approved',
    message: 'Your lawyer approved the consultation appointment.',
  }),
  [NOTIFICATION_TYPES.APPOINTMENT_REJECTED]: Object.freeze({
    title: 'Appointment rejected',
    message: 'Your lawyer could not accept the consultation appointment.',
  }),
  [NOTIFICATION_TYPES.APPOINTMENT_CANCELLED]: Object.freeze({
    title: 'Appointment cancelled',
    message: 'The other participant cancelled the consultation appointment.',
  }),
  [NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED]: Object.freeze({
    title: 'Appointment rescheduled',
    message: 'A client requested a new consultation time for your review.',
  }),
  [NOTIFICATION_TYPES.SECURE_MESSAGE_RECEIVED]: Object.freeze({
    title: 'New secure message',
    message: 'You received a new message about an approved appointment.',
  }),
});

const createNotificationNotFoundError = () => {
  const error = new Error('Notification not found.');
  error.statusCode = 404;
  return error;
};

export const recordAppointmentNotification = async ({
  recipientId,
  appointmentId,
  type,
  eventSequence = 0,
}) => {
  const content = NOTIFICATION_CONTENT[type];

  if (!content) {
    throw new TypeError(`Unsupported notification type: ${type}`);
  }

  const eventKey = [
    appointmentId.toString(),
    recipientId.toString(),
    type,
    eventSequence,
  ].join(':');

  await Notification.updateOne(
    { eventKey },
    {
      $setOnInsert: {
        recipient: recipientId,
        appointment: appointmentId,
        type,
        title: content.title,
        message: content.message,
        eventKey,
      },
    },
    { upsert: true },
  );
};

export const listNotifications = async ({
  recipientId,
  unreadOnly,
  page,
  limit,
}) => {
  const filter = {
    recipient: recipientId,
    ...(unreadOnly ? { readAt: null } : {}),
  };
  const skip = (page - 1) * limit;
  const [notifications, totalItems] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const countUnreadNotifications = async (recipientId) =>
  Notification.countDocuments({
    recipient: recipientId,
    readAt: null,
  });

export const markNotificationAsRead = async ({
  recipientId,
  notificationId,
}) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      recipient: recipientId,
    },
    {
      $set: {
        readAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!notification) {
    throw createNotificationNotFoundError();
  }

  return notification;
};
