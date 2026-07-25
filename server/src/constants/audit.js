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
  MFA_ENABLED: 'auth.mfa_enabled',
  MFA_DISABLED: 'auth.mfa_disabled',
  MFA_CHALLENGE_FAILED: 'auth.mfa_challenge_failed',
  MFA_RECOVERY_CODE_USED: 'auth.mfa_recovery_code_used',
  PASSWORD_RESET_REQUESTED: 'auth.password_reset_requested',
  PASSWORD_RESET_DELIVERY_FAILED: 'auth.password_reset_delivery_failed',
  PASSWORD_RESET_COMPLETED: 'auth.password_reset_completed',
  PASSWORD_CHANGED: 'auth.password_changed',
  LOGOUT: 'auth.logout',
  EMAIL_VERIFICATION_REQUESTED: 'auth.email_verification_requested',
  EMAIL_VERIFICATION_DELIVERY_FAILED: 'auth.email_verification_delivery_failed',
  EMAIL_VERIFICATION_COMPLETED: 'auth.email_verification_completed',
  EMAIL_VERIFICATION_FAILED: 'auth.email_verification_failed',
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
  ACCOUNT_DATA_IMPORTED: 'account.data_imported',
  AUDIT_LOGS_VIEWED: 'audit.logs_viewed',
  IP_ACCESS_RULE_CREATED: 'ip_access.rule_created',
  IP_ACCESS_RULE_UPDATED: 'ip_access.rule_updated',
  IP_ACCESS_RULE_DELETED: 'ip_access.rule_deleted',
  IP_ACCESS_DENIED: 'ip_access.denied',
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
  IP_ACCESS_RULE: 'ip_access_rule',
});

export const AUDIT_TARGET_TYPE_VALUES = Object.freeze(
  Object.values(AUDIT_TARGET_TYPES),
);
