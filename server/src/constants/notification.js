export const NOTIFICATION_TYPES = Object.freeze({
  APPOINTMENT_CREATED: 'appointment_created',
  APPOINTMENT_APPROVED: 'appointment_approved',
  APPOINTMENT_REJECTED: 'appointment_rejected',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
});

export const NOTIFICATION_TYPE_VALUES = Object.freeze(
  Object.values(NOTIFICATION_TYPES),
);
