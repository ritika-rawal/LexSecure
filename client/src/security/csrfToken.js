import axios from 'axios';

import { env } from '../config/env.js';

const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

let cachedToken = null;
let tokenRequest = null;

export const clearCsrfToken = () => {
  cachedToken = null;
};

export const getCsrfToken = async () => {
  if (cachedToken) return cachedToken;

  if (!tokenRequest) {
    tokenRequest = axios
      .get(`${env.apiBaseUrl}/auth/csrf-token`, {
        headers: { Accept: 'application/json' },
        timeout: 10_000,
        withCredentials: true,
      })
      .then((response) => {
        const token = response.data?.data?.csrfToken;

        if (typeof token !== 'string' || !CSRF_TOKEN_PATTERN.test(token)) {
          throw new Error('The API returned an invalid CSRF token.');
        }

        cachedToken = token;
        return token;
      })
      .finally(() => {
        tokenRequest = null;
      });
  }

  return tokenRequest;
};
