const TOTP_PATTERN = /^\d{6}$/;
const RECOVERY_CODE_PATTERN = /^(?:[A-F0-9]{4}-){5}[A-F0-9]{4}$/;

export const normalizeMfaCode = (value) => value.trim().toUpperCase();

export const validateMfaCode = (value, allowRecoveryCode = true) => {
  const normalized = normalizeMfaCode(value);

  if (
    TOTP_PATTERN.test(normalized)
    || (allowRecoveryCode && RECOVERY_CODE_PATTERN.test(normalized))
  ) {
    return '';
  }

  return allowRecoveryCode
    ? 'Enter a six-digit authenticator code or recovery code.'
    : 'Enter the six-digit code from your authenticator app.';
};
