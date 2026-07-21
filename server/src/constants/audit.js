import { USER_ROLE_VALUES } from './user-roles.js';

export const AUDIT_ACTOR_ROLES = Object.freeze({
  ANONYMOUS: 'anonymous',
  SYSTEM: 'system',
});

export const AUDIT_ACTOR_ROLE_VALUES = Object.freeze([
  ...USER_ROLE_VALUES,
  ...Object.values(AUDIT_ACTOR_ROLES),
]);

export const AUDIT_ACTIONS = Object.freeze({
  USER_REGISTERED: 'auth.user_registered',
  LOGIN_SUCCEEDED: 'auth.login_succeeded',
  LOGIN_FAILED: 'auth.login_failed',
  ACCOUNT_LOCKED: 'auth.account_locked',
  LOGOUT: 'auth.logout',
  LAWYER_PROFILE_CREATED: 'lawyer_profile.created',
  LAWYER_PROFILE_UPDATED: 'lawyer_profile.updated',
  LAWYER_PROFILE_APPROVED: 'lawyer_profile.approved',
  LAWYER_PROFILE_REJECTED: 'lawyer_profile.rejected',
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_APPROVED: 'appointment.approved',
  APPOINTMENT_REJECTED: 'appointment.rejected',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_RESCHEDULED: 'appointment.rescheduled',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_DOWNLOADED: 'document.downloaded',
  MESSAGE_SENT: 'message.sent',
  REVIEW_CREATED: 'review.created',
  ACCOUNT_DATA_EXPORTED: 'account.data_exported',
  AUDIT_LOGS_VIEWED: 'audit.logs_viewed',
});

export const AUDIT_ACTION_VALUES = Object.freeze(
  Object.values(AUDIT_ACTIONS),
);

export const AUDIT_OUTCOMES = Object.freeze({
  SUCCESS: 'success',
  FAILURE: 'failure',
});

export const AUDIT_OUTCOME_VALUES = Object.freeze(
  Object.values(AUDIT_OUTCOMES),
);

export const AUDIT_TARGET_TYPES = Object.freeze({
  USER: 'user',
  LAWYER_PROFILE: 'lawyer_profile',
  APPOINTMENT: 'appointment',
  DOCUMENT: 'document',
  MESSAGE: 'message',
  REVIEW: 'review',
  AUDIT_LOG: 'audit_log',
});

export const AUDIT_TARGET_TYPE_VALUES = Object.freeze(
  Object.values(AUDIT_TARGET_TYPES),
);
