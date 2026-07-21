import axios from 'axios';

import { env } from '../config/env.js';
import { clearCsrfToken, getCsrfToken } from '../security/csrfToken.js';

const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_ERROR_CODE = 'CSRF_TOKEN_INVALID';
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const SESSION_CHANGING_PATHS = new Set([
  '/auth/login',
  '/auth/logout',
  '/auth/mfa/verify-login',
  '/auth/mfa/disable',
]);

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10_000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use(async (config) => {
  const method = config.method?.toLowerCase() || 'get';

  if (!SAFE_METHODS.has(method)) {
    config.headers[CSRF_HEADER_NAME] = await getCsrfToken();
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    if (SESSION_CHANGING_PATHS.has(response.config.url)) {
      // Login regenerates and logout destroys the session that owns the token.
      clearCsrfToken();
    }

    return response;
  },
  async (error) => {
    const requestConfig = error.config;

    if (error.response?.status === 401) {
      clearCsrfToken();
    }

    if (
      requestConfig
      && !requestConfig.csrfRetried
      && error.response?.status === 403
      && error.response?.data?.code === CSRF_ERROR_CODE
    ) {
      /*
       * CSRF middleware rejects before a route executes, so this single retry
       * cannot duplicate a completed state-changing operation.
       */
      requestConfig.csrfRetried = true;
      clearCsrfToken();
      requestConfig.headers?.delete?.(CSRF_HEADER_NAME);
      return httpClient.request(requestConfig);
    }

    return Promise.reject(error);
  },
);
