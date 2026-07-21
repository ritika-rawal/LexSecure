import { appConfig } from './app.config.js';

export const helmetOptions = Object.freeze({
  // API responses never need to execute or embed active browser content.
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginOpenerPolicy: {
    policy: 'same-origin',
  },
  crossOriginResourcePolicy: {
    policy: 'same-site',
  },
  referrerPolicy: {
    policy: 'no-referrer',
  },
  xFrameOptions: {
    action: 'deny',
  },
  // HSTS must only be emitted when the application is actually served by HTTPS.
  strictTransportSecurity: appConfig.isProduction
    ? {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: false,
      }
    : false,
});
