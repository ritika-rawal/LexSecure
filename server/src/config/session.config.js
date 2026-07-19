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

  if (!appConfig.sessionSecret || appConfig.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
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
