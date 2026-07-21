export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_TOKEN_BYTES = 32;
export const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const CSRF_ERROR_CODE = 'CSRF_TOKEN_INVALID';

export const CSRF_SAFE_METHODS = Object.freeze(
  new Set(['GET', 'HEAD', 'OPTIONS']),
);
