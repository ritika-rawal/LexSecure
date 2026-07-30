import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.config.js';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { User } from '../models/User.model.js';
import { recordAuditEventWithoutBlocking } from '../services/audit.service.js';
import { establishAuthenticatedSession } from '../services/authentication-session.service.js';
import {
  consumeEmailVerificationToken,
  issueEmailVerificationToken,
} from '../services/email-verification.service.js';
import { REGISTRATION_RESPONSE_MESSAGE } from '../constants/email-verification.js';
import {
  isLoginLocked,
  isLoginCaptchaRequired,
  recordFailedLoginAttempt,
  recordSessionLoginFailure,
} from '../services/login-security.service.js';
import { verifyCaptchaToken } from '../services/captcha.service.js';
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from '../utils/password.js';
import { buildSafeUserResponse } from '../utils/safe-user.js';
import { destroySession, regenerateSession, saveSession } from '../utils/session.js';
import { MFA_LIMITS } from '../constants/mfa.js';
import {
  CAPTCHA_ERROR_CODES,
  LOGIN_SECURITY_LIMITS,
} from '../constants/authentication-security.js';
import {
  getPasswordExpiresAt,
  isPasswordExpired,
  PASSWORD_POLICY_ERROR_CODES,
} from '../services/password-policy.service.js';

const createInvalidCredentialsError = () => {
  const error = new Error('Invalid email or password.');
  error.statusCode = 401;
  return error;
};

const createCaptchaError = ({ code, message }) => {
  const error = new Error(message);
  error.statusCode = 403;
  error.publicCode = code;
  return error;
};

const requireValidCaptchaWhenChallenged = async (req) => {
  const sourceFailureCount = req.rateLimit?.used;
  const sourceRequiresCaptcha =
    Number.isInteger(sourceFailureCount)
    && sourceFailureCount > LOGIN_SECURITY_LIMITS.CAPTCHA_AFTER_SESSION_FAILURES;

  if (!sourceRequiresCaptcha && !isLoginCaptchaRequired(req.session)) return;

  if (!req.body.captchaToken) {
    throw createCaptchaError({
      code: CAPTCHA_ERROR_CODES.REQUIRED,
      message: 'Complete the security verification and try again.',
    });
  }

  const isValid = await verifyCaptchaToken({
    token: req.body.captchaToken,
    remoteIp: req.ip,
  });

  if (!isValid) {
    throw createCaptchaError({
      code: CAPTCHA_ERROR_CODES.INVALID,
      message: 'Security verification failed. Complete a new challenge.',
    });
  }
};

const respondToRegistration = (res) => {
  res.status(202).json({
    status: 'success',
    message: REGISTRATION_RESPONSE_MESSAGE,
  });
};

export const registerUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.exists({ email: normalizedEmail });

  if (existingUser) {
    // Perform equivalent password-hashing work so response timing does not
    // reveal whether the email was already registered.
    await hashPassword(password);
    respondToRegistration(res);
    return;
  }

  const passwordHash = await hashPassword(password);
  const passwordChangedAt = new Date();

  let user;

  try {
    user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      passwordChangedAt,
      passwordExpiresAt: getPasswordExpiresAt(passwordChangedAt),
      role,
    });
  } catch (error) {
    if (error.code === 11000) {
      // Another request won a registration race for this email; respond
      // exactly like the known-duplicate path above.
      respondToRegistration(res);
      return;
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

  await issueEmailVerificationToken({ req, user });

  respondToRegistration(res);
};

export const verifyEmail = async (req, res) => {
  const { token } = req.body;

  await consumeEmailVerificationToken({ req, token });

  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully. You can now use all account features.',
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  await requireValidCaptchaWhenChallenged(req);

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+passwordHash +failedLoginAttempts +lockedUntil +authVersion +passwordChangedAt +passwordExpiresAt',
  );
  const passwordHash = user?.passwordHash || DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(password, passwordHash);
  const accountIsLocked = isLoginLocked(user);

  let becameLocked = false;

  if (user && !passwordMatches && !accountIsLocked) {
    ({ becameLocked } = await recordFailedLoginAttempt(user._id));
  }

  if (!user || !passwordMatches || accountIsLocked) {
    const captchaIsNowRequired = await recordSessionLoginFailure(req);

    await recordAuditEventWithoutBlocking({
      req,
      actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      outcome: AUDIT_OUTCOMES.FAILURE,
      targetType: AUDIT_TARGET_TYPES.USER,
      subject: normalizedEmail,
    });

    if (becameLocked) {
      await recordAuditEventWithoutBlocking({
        req,
        actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
        action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
        outcome: AUDIT_OUTCOMES.FAILURE,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: user._id,
        subject: normalizedEmail,
      });
    }

    const invalidCredentialsError = createInvalidCredentialsError();

    if (captchaIsNowRequired) {
      invalidCredentialsError.publicCode = CAPTCHA_ERROR_CODES.REQUIRED;
    }

    throw invalidCredentialsError;
  }

  if (!user.isActive) {
    const captchaIsNowRequired = await recordSessionLoginFailure(req);

    await recordAuditEventWithoutBlocking({
      req,
      actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      outcome: AUDIT_OUTCOMES.FAILURE,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: user._id,
      subject: normalizedEmail,
    });
    const invalidCredentialsError = createInvalidCredentialsError();

    if (captchaIsNowRequired) {
      invalidCredentialsError.publicCode = CAPTCHA_ERROR_CODES.REQUIRED;
    }

    throw invalidCredentialsError;
  }

  if (isPasswordExpired(user)) {
    const error = new Error('Your password has expired. Reset it before signing in.');
    error.statusCode = 403;
    error.publicCode = PASSWORD_POLICY_ERROR_CODES.EXPIRED;
    throw error;
  }

  if (user.mfaEnabled) {
    await regenerateSession(req);
    req.session.mfaChallenge = {
      userId: user.id,
      authVersion: user.authVersion,
      attempts: 0,
      expiresAt: Date.now() + MFA_LIMITS.LOGIN_CHALLENGE_EXPIRY_MS,
    };
    await saveSession(req);

    res.set('Cache-Control', 'private, no-store');
    res.status(202).json({
      status: 'success',
      message: 'Additional authentication is required.',
      data: { requiresMfa: true },
    });
    return;
  }

  await establishAuthenticatedSession({ req, user });

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
