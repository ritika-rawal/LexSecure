export const AUDIT_LOG_PAGE_SIZE = 25;

export const AUDIT_ACTION_OPTIONS = Object.freeze([
  'auth.user_registered',
  'auth.login_succeeded',
  'auth.login_failed',
  'auth.account_locked',
  'auth.mfa_enabled',
  'auth.mfa_disabled',
  'auth.mfa_challenge_failed',
  'auth.mfa_recovery_code_used',
  'auth.password_reset_requested',
  'auth.password_reset_delivery_failed',
  'auth.password_reset_completed',
  'auth.password_changed',
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
  'review.created',
  'account.data_exported',
  'account.data_imported',
  'audit.logs_viewed',
  'ip_access.rule_created',
  'ip_access.rule_updated',
  'ip_access.rule_deleted',
  'ip_access.denied',
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
  'review',
  'audit_log',
  'ip_access_rule',
]);
