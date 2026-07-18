const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';

const removeTrailingSlash = (value) => value.replace(/\/+$/, '');

export const env = Object.freeze({
  apiBaseUrl: removeTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL),
});
