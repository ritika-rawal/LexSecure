import MongoStore from 'connect-mongo';

import { appConfig } from './app.config.js';

export const SESSION_COOKIE_NAME = 'lexsecure.sid';

export const sessionCookieOptions = Object.freeze({
  httpOnly: true,
  secure: appConfig.isProduction,
  sameSite: 'lax',
});

export const createSessionOptions = () => {
  if (!appConfig.mongodbUri) {
    throw new Error('MONGODB_URI is required to configure session storage.');
  }

  if (!appConfig.sessionSecret) {
    throw new Error('SESSION_SECRET is required to configure secure sessions.');
  }

  if (appConfig.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long.');
  }

  if (!/[A-Z].*[A-Z]/.test(appConfig.sessionSecret)) {
    throw new Error('SESSION_SECRET must include at least two uppercase letters.');
  }

  if (!/[a-z].*[a-z]/.test(appConfig.sessionSecret)) {
    throw new Error('SESSION_SECRET must include at least two lowercase letters.');
  }

  if (!/[0-9].*[0-9]/.test(appConfig.sessionSecret)) {
    throw new Error('SESSION_SECRET must include at least two numbers.');
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?].*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(appConfig.sessionSecret)) {
    throw new Error('SESSION_SECRET must include at least two special characters.');
  }

  return {
    name: SESSION_COOKIE_NAME,
    secret: appConfig.sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({
      mongoUrl: appConfig.mongodbUri,
      collectionName: 'sessions',
      ttl: appConfig.sessionMaxAgeMs / 1000,
    }),
    cookie: {
      ...sessionCookieOptions,
      maxAge: appConfig.sessionMaxAgeMs,
    },
  };
};
