export const APPOINTMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

export const APPOINTMENT_STATUS_VALUES = Object.freeze(
  Object.values(APPOINTMENT_STATUS),
);

export const CONSULTATION_TYPES = Object.freeze({
  VIDEO: 'video',
  PHONE: 'phone',
  IN_PERSON: 'in_person',
});

export const CONSULTATION_TYPE_VALUES = Object.freeze(
  Object.values(CONSULTATION_TYPES),
);

export const APPOINTMENT_DURATION_LIMITS_MS = Object.freeze({
  MINIMUM: 15 * 60 * 1000,
  MAXIMUM: 4 * 60 * 60 * 1000,
});
