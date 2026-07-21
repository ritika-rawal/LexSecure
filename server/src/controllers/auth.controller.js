import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.config.js';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { User } from '../models/User.model.js';
import { recordAuditEventWithoutBlocking } from '../services/audit.service.js';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from '../utils/password.js';
import { buildSafeUserResponse } from '../utils/safe-user.js';
import { destroySession, regenerateSession, saveSession } from '../utils/session.js';

const createInvalidCredentialsError = () => {
  const error = new Error('Invalid email or password.');
  error.statusCode = 401;
  return error;
};

export const registerUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.exists({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  let user;

  try {
    user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateEmailError = new Error('An account with this email already exists.');
      duplicateEmailError.statusCode = 409;
      throw duplicateEmailError;
    }

    throw error;
  }

  await recordAuditEventWithoutBlocking({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.USER_REGISTERED,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: user._id,
  });

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully.',
    data: {
      user: buildSafeUserResponse(user),
    },
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
  const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(password, passwordHash);

  if (!user || !passwordMatches) {
    await recordAuditEventWithoutBlocking({
      req,
      actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      outcome: AUDIT_OUTCOMES.FAILURE,
      targetType: AUDIT_TARGET_TYPES.USER,
      subject: normalizedEmail,
    });
    throw createInvalidCredentialsError();
  }

  if (!user.isActive) {
    await recordAuditEventWithoutBlocking({
      req,
      actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      outcome: AUDIT_OUTCOMES.FAILURE,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: user._id,
      subject: normalizedEmail,
    });
    const error = new Error('This account is disabled.');
    error.statusCode = 403;
    throw error;
  }

  await regenerateSession(req);
  req.session.user = { id: user.id, role: user.role };

  user.lastLoginAt = new Date();
  await user.save();
  await saveSession(req);

  await recordAuditEventWithoutBlocking({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.LOGIN_SUCCEEDED,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: user._id,
  });

  res.status(200).json({
    status: 'success',
    message: 'User logged in successfully.',
    data: { user: buildSafeUserResponse(user) },
  });
};

export const logoutUser = async (req, res) => {
  const sessionUser = req.session?.user;

  await destroySession(req);
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);

  if (sessionUser?.id && sessionUser?.role) {
    await recordAuditEventWithoutBlocking({
      req,
      actorId: sessionUser.id,
      actorRole: sessionUser.role,
      action: AUDIT_ACTIONS.LOGOUT,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: sessionUser.id,
    });
  }

  res.status(204).send();
};

export const getCurrentUser = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { user: req.user },
  });
};
