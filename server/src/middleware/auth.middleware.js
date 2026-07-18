import mongoose from 'mongoose';

import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.config.js';
import { USER_ROLE_VALUES } from '../constants/user-roles.js';
import { User } from '../models/User.model.js';
import { buildSafeUserResponse } from '../utils/safe-user.js';
import { destroySession } from '../utils/session.js';

const createAuthenticationError = () => {
  const error = new Error('Authentication required.');
  error.statusCode = 401;
  return error;
};

export const requireAuthentication = async (req, res, next) => {
  const sessionUserId = req.session?.user?.id;

  if (!sessionUserId) {
    throw createAuthenticationError();
  }

  if (!mongoose.isValidObjectId(sessionUserId)) {
    await destroySession(req);
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
    throw createAuthenticationError();
  }

  const user = await User.findById(sessionUserId);

  if (!user || !user.isActive) {
    await destroySession(req);
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
    throw createAuthenticationError();
  }

  req.user = buildSafeUserResponse(user);
  next();
};

export const authorizeRoles = (...allowedRoles) => {
  if (allowedRoles.length === 0) {
    throw new TypeError('authorizeRoles requires at least one allowed role.');
  }

  const invalidRole = allowedRoles.find((role) => !USER_ROLE_VALUES.includes(role));

  if (invalidRole) {
    throw new TypeError(`Unknown role supplied to authorizeRoles: ${invalidRole}`);
  }

  const allowedRoleSet = new Set(allowedRoles);

  return (req, res, next) => {
    if (!req.user) {
      throw createAuthenticationError();
    }

    if (!allowedRoleSet.has(req.user.role)) {
      const error = new Error('You do not have permission to access this resource.');
      error.statusCode = 403;
      throw error;
    }

    next();
  };
};
