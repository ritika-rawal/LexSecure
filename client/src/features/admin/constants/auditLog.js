export const AUDIT_LOG_PAGE_SIZE = 25;

export const AUDIT_ACTION_OPTIONS = Object.freeze([
  'auth.user_registered',
  'auth.login_succeeded',
  'auth.login_failed',
  'auth.logout',
  'lawyer_profile.created',
  'lawyer_profile.updated',
  'lawyer_profile.approved',
  'lawyer_profile.rejected',
  'appointment.created',
  'appointment.approved',
  'appointment.rejected',
  'appointment.cancelled',
  'appointment.rescheduled',
  'document.uploaded',
  'document.downloaded',
  'message.sent',
  'audit.logs_viewed',
]);

export const AUDIT_OUTCOME_OPTIONS = Object.freeze([
  'success',
  'failure',
]);

export const AUDIT_ACTOR_ROLE_OPTIONS = Object.freeze([
  'client',
  'lawyer',
  'admin',
  'anonymous',
  'system',
]);

export const AUDIT_TARGET_TYPE_OPTIONS = Object.freeze([
  'user',
  'lawyer_profile',
  'appointment',
  'document',
  'message',
  'audit_log',
]);
