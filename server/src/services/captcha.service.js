import { randomUUID } from 'node:crypto';

import { appConfig } from '../config/app.config.js';
import { CAPTCHA_ERROR_CODES } from '../constants/authentication-security.js';

const TURNSTILE_SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const createUnavailableError = () => {
  const error = new Error('Security verification is temporarily unavailable.');
  error.statusCode = 503;
  error.publicCode = CAPTCHA_ERROR_CODES.UNAVAILABLE;
  return error;
};

const isExpectedAction = (action) =>
  action === appConfig.turnstile.expectedAction
  || (appConfig.turnstile.allowsDevelopmentTestResponse && action === 'test');

export const verifyCaptchaToken = async ({ token, remoteIp }) => {
  const body = new URLSearchParams({
    secret: appConfig.turnstile.secretKey,
    response: token,
    remoteip: remoteIp,
    idempotency_key: randomUUID(),
  });

  let response;

  try {
    response = await fetch(TURNSTILE_SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(appConfig.turnstile.verificationTimeoutMs),
    });
  } catch {
    throw createUnavailableError();
  }

  if (!response.ok) {
    throw createUnavailableError();
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw createUnavailableError();
  }

  const hostname =
    typeof result.hostname === 'string' ? result.hostname.toLowerCase() : '';
  const isDevelopmentTestResponse =
    appConfig.turnstile.allowsDevelopmentTestResponse
    && result.success
    && hostname === 'example.com'
    && result.action === undefined;

  return Boolean(
    result.success
    && (
      isDevelopmentTestResponse
      || (
        isExpectedAction(result.action)
        && appConfig.turnstile.allowedHostnames.includes(hostname)
      )
    ),
  );
};
