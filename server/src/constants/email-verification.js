export const EMAIL_VERIFICATION_LIMITS = Object.freeze({
  TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000,
  TOKEN_BYTES: 32,
});

export const EMAIL_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const REGISTRATION_RESPONSE_MESSAGE =
  'Registration received. If this email is not already registered, check your inbox to verify your account within 24 hours.';

export const EMAIL_VERIFICATION_REQUIRED_ERROR_CODE = 'EMAIL_VERIFICATION_REQUIRED';
