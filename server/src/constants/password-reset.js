export const PASSWORD_RESET_LIMITS = Object.freeze({
  TOKEN_EXPIRY_MS: 15 * 60 * 1000,
  TOKEN_BYTES: 32,
});

export const PASSWORD_RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const PASSWORD_RESET_RESPONSE_MESSAGE =
  'If an active account matches that email, password reset instructions will be sent.';
