import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { MFA_LIMITS } from '../constants/mfa.js';
import { recordAuditEventWithoutBlocking } from '../services/audit.service.js';
import { establishAuthenticatedSession } from '../services/authentication-session.service.js';
import {
  beginMfaSetup as beginMfaSetupService,
  disableMfa as disableMfaService,
  enableMfa as enableMfaService,
  getMfaManagementUser,
  getMfaUser,
  verifyEnabledMfaCode,
} from '../services/mfa.service.js';
import { verifyPassword } from '../utils/password.js';
import { buildSafeUserResponse } from '../utils/safe-user.js';
import { regenerateSession, saveSession } from '../utils/session.js';

const createInvalidMfaError = () => {
  const error = new Error('Invalid or expired authentication code.');
  error.statusCode = 401;
  return error;
};

const recordAuthenticatedMfaEvent = (req, action) =>
  recordAuditEventWithoutBlocking({
    req,
    actorId: req.user.id,
    actorRole: req.user.role,
    action,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: req.user.id,
  });

export const beginMfaSetup = async (req, res) => {
  const setup = await beginMfaSetupService({ req, user: req.user });

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    data: { setup },
  });
};

export const enableMfa = async (req, res) => {
  const recoveryCodes = await enableMfaService({
    req,
    user: req.user,
    code: req.body.code,
  });
  const user = { ...req.user, mfaEnabled: true };

  await recordAuthenticatedMfaEvent(req, AUDIT_ACTIONS.MFA_ENABLED);

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    message: 'Multi-factor authentication enabled.',
    data: {
      user: buildSafeUserResponse(user),
      recoveryCodes,
    },
  });
};

export const verifyMfaLogin = async (req, res) => {
  const challenge = req.session?.mfaChallenge;

  if (
    !challenge
    || challenge.expiresAt <= Date.now()
    || challenge.attempts >= MFA_LIMITS.MAXIMUM_CHALLENGE_ATTEMPTS
  ) {
    delete req.session.mfaChallenge;
    await saveSession(req);
    throw createInvalidMfaError();
  }

  const user = await getMfaUser(challenge.userId);
  const verification =
    user?.isActive
      && user.mfaEnabled
      && user.mfaSecret
      && user.authVersion === challenge.authVersion
      ? await verifyEnabledMfaCode({ user, code: req.body.code })
      : { valid: false, recoveryCodeUsed: false };

  if (!verification.valid) {
    challenge.attempts += 1;

    if (challenge.attempts >= MFA_LIMITS.MAXIMUM_CHALLENGE_ATTEMPTS) {
      delete req.session.mfaChallenge;
    }

    await saveSession(req);
    await recordAuditEventWithoutBlocking({
      req,
      actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
      action: AUDIT_ACTIONS.MFA_CHALLENGE_FAILED,
      outcome: AUDIT_OUTCOMES.FAILURE,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: user?._id || null,
    });
    throw createInvalidMfaError();
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

  if (verification.recoveryCodeUsed) {
    await recordAuditEventWithoutBlocking({
      req,
      actorId: user._id,
      actorRole: user.role,
      action: AUDIT_ACTIONS.MFA_RECOVERY_CODE_USED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: user._id,
    });
  }

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    message: 'Authentication completed.',
    data: { user: buildSafeUserResponse(user) },
  });
};

export const disableMfa = async (req, res) => {
  const user = await getMfaManagementUser(req.user.id);
  const passwordMatches = user
    ? await verifyPassword(req.body.password, user.passwordHash)
    : false;
  const verification =
    passwordMatches && user.mfaEnabled && user.mfaSecret
      ? await verifyEnabledMfaCode({ user, code: req.body.code })
      : { valid: false };

  if (!passwordMatches || !verification.valid) {
    throw createInvalidMfaError();
  }

  await disableMfaService(user._id);
  await regenerateSession(req);
  req.session.user = {
    id: user.id,
    role: user.role,
    authVersion: user.authVersion,
  };
  await saveSession(req);

  const safeUser = { ...req.user, mfaEnabled: false };
  await recordAuthenticatedMfaEvent(req, AUDIT_ACTIONS.MFA_DISABLED);

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    message: 'Multi-factor authentication disabled.',
    data: { user: buildSafeUserResponse(safeUser) },
  });
};
