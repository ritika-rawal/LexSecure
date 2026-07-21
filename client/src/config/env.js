const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const DEVELOPMENT_TURNSTILE_SITE_KEY = '1x00000000000000000000AA';

const removeTrailingSlash = (value) => value.replace(/\/+$/, '');

export const env = Object.freeze({
  apiBaseUrl: removeTrailingSlash(import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL),
  turnstileSiteKey:
    import.meta.env.VITE_TURNSTILE_SITE_KEY || DEVELOPMENT_TURNSTILE_SITE_KEY,
});
