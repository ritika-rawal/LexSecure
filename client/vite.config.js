import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
const DEVELOPMENT_ORIGIN = 'http://localhost:3000';
const TURNSTILE_ORIGIN = 'https://challenges.cloudflare.com';

const parseHttpOrigin = (value) => {
  const url = new URL(value);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('VITE_API_BASE_URL must use HTTP or HTTPS.');
  }

  return url.origin;
};

const createContentSecurityPolicy = ({ apiOrigin, allowDevelopmentTransforms }) => {
  const connectSources = ["'self'", apiOrigin];

  if (allowDevelopmentTransforms) {
    connectSources.push(DEVELOPMENT_ORIGIN.replace('http:', 'ws:'));
  }

  const scriptSources = ["'self'", TURNSTILE_ORIGIN];
  const styleSources = ["'self'"];

  // Vite injects its React refresh preamble and transformed CSS during development.
  if (allowDevelopmentTransforms) {
    scriptSources.push("'unsafe-inline'");
    styleSources.push("'unsafe-inline'");
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src ${connectSources.join(' ')}`,
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    `frame-src ${TURNSTILE_ORIGIN}`,
    "img-src 'self' data:",
    "object-src 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "script-src-attr 'none'",
    `style-src ${styleSources.join(' ')}`,
  ].join('; ');
};

const createSecurityHeaders = (contentSecurityPolicy) => ({
  'Content-Security-Policy': contentSecurityPolicy,
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = parseHttpOrigin(env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL);

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 3000,
      strictPort: true,
      headers: createSecurityHeaders(
        createContentSecurityPolicy({ apiOrigin, allowDevelopmentTransforms: true }),
      ),
    },
    preview: {
      host: 'localhost',
      port: 3000,
      strictPort: true,
      headers: createSecurityHeaders(
        createContentSecurityPolicy({ apiOrigin, allowDevelopmentTransforms: false }),
      ),
    },
  };
});
