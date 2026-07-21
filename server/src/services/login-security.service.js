import { LOGIN_SECURITY_LIMITS } from '../constants/authentication-security.js';
import { User } from '../models/User.model.js';
import { saveSession } from '../utils/session.js';

const getCaptchaState = (session) => {
  const state = session?.loginCaptcha;

  if (
    !state
    || !Number.isInteger(state.failures)
    || typeof state.requiredUntil !== 'number'
  ) {
    return { failures: 0, requiredUntil: 0 };
  }

  return state;
};

export const isLoginCaptchaRequired = (session, now = Date.now()) =>
  getCaptchaState(session).requiredUntil > now;

export const recordSessionLoginFailure = async (req, now = Date.now()) => {
  const currentState = getCaptchaState(req.session);
  const failures = currentState.failures + 1;
  const shouldRequireCaptcha =
    failures >= LOGIN_SECURITY_LIMITS.CAPTCHA_AFTER_SESSION_FAILURES;

  req.session.loginCaptcha = {
    failures,
    requiredUntil: shouldRequireCaptcha
      ? now + LOGIN_SECURITY_LIMITS.CAPTCHA_REQUIREMENT_DURATION_MS
      : currentState.requiredUntil,
  };

  await saveSession(req);
  return shouldRequireCaptcha;
};

export const isLoginLocked = (user, now = new Date()) =>
  user?.lockedUntil instanceof Date
  && user.lockedUntil.getTime() > now.getTime();

export const recordFailedLoginAttempt = async (userId) => {
  const now = new Date();

  await User.updateOne(
    {
      _id: userId,
      lockedUntil: { $lte: now },
    },
    {
      $set: { failedLoginAttempts: 0 },
      $unset: { lockedUntil: '' },
    },
  );

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      $or: [
        { lockedUntil: null },
        { lockedUntil: { $lte: now } },
      ],
    },
    {
      $inc: { failedLoginAttempts: 1 },
      $unset: { lockedUntil: '' },
    },
    { new: true },
  ).select('+failedLoginAttempts +lockedUntil');

  if (!updatedUser) {
    return { becameLocked: false };
  }

  if (
    updatedUser.failedLoginAttempts
    < LOGIN_SECURITY_LIMITS.MAXIMUM_FAILED_ATTEMPTS
  ) {
    return { becameLocked: false };
  }

  const lockResult = await User.updateOne(
    {
      _id: userId,
      lockedUntil: null,
      failedLoginAttempts: {
        $gte: LOGIN_SECURITY_LIMITS.MAXIMUM_FAILED_ATTEMPTS,
      },
    },
    {
      $set: {
        lockedUntil: new Date(
          now.getTime() + LOGIN_SECURITY_LIMITS.LOCKOUT_DURATION_MS,
        ),
      },
    },
  );

  return { becameLocked: lockResult.modifiedCount === 1 };
};

export const clearFailedLoginAttempts = async (userId, lastLoginAt) => {
  await User.updateOne(
    { _id: userId },
    {
      $set: {
        failedLoginAttempts: 0,
        lastLoginAt,
      },
      $unset: { lockedUntil: '' },
    },
  );
};
