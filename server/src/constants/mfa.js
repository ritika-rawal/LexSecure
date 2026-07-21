export const MFA_ISSUER = 'LexSecure';
export const MFA_TOTP_PATTERN = /^\d{6}$/;
export const MFA_RECOVERY_CODE_PATTERN = /^(?:[A-F0-9]{4}-){5}[A-F0-9]{4}$/;

export const MFA_LIMITS = Object.freeze({
  SETUP_EXPIRY_MS: 10 * 60 * 1000,
  LOGIN_CHALLENGE_EXPIRY_MS: 5 * 60 * 1000,
  MAXIMUM_CHALLENGE_ATTEMPTS: 5,
  RECOVERY_CODE_COUNT: 10,
  TOTP_TOLERANCE_SECONDS: 30,
});
