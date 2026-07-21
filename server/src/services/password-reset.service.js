import { appConfig } from '../config/app.config.js';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { PASSWORD_RESET_LIMITS } from '../constants/password-reset.js';
import { User } from '../models/User.model.js';
import { recordAuditEventWithoutBlocking } from './audit.service.js';
import {
  assertEmailDeliveryConfigured,
  sendPasswordResetEmail,
} from './email.service.js';
import { buildPasswordReplacement } from './password-policy.service.js';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '../utils/password-reset-token.js';

const createInvalidResetTokenError = () => {
  const error = new Error('Password reset link is invalid or has expired.');
  error.statusCode = 400;
  return error;
};

const createResetUrl = (token) => {
  const resetUrl = new URL(appConfig.passwordResetUrl);
  resetUrl.searchParams.set('token', token);
  return resetUrl.toString();
};

const deliverResetInstructions = ({ req, user, token, tokenHash }) => {
  setImmediate(async () => {
    try {
      await sendPasswordResetEmail({
        recipient: user.email,
        resetUrl: createResetUrl(token),
      });
      await recordAuditEventWithoutBlocking({
        req,
        actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
        action: AUDIT_ACTIONS.PASSWORD_RESET_REQUESTED,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: user._id,
      });
    } catch {
      await User.updateOne(
        { _id: user._id, passwordResetTokenHash: tokenHash },
        {
          $unset: {
            passwordResetTokenHash: '',
            passwordResetExpiresAt: '',
          },
        },
      );
      await recordAuditEventWithoutBlocking({
        req,
        actorRole: AUDIT_ACTOR_ROLES.SYSTEM,
        action: AUDIT_ACTIONS.PASSWORD_RESET_DELIVERY_FAILED,
        outcome: AUDIT_OUTCOMES.FAILURE,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: user._id,
      });
      console.error('Password reset email delivery failed.');
    }
  });
};

export const requestPasswordReset = async ({ req, email }) => {
  // Check service availability before account lookup to preserve generic behavior.
  assertEmailDeliveryConfigured();

  const user = await User.findOne({ email, isActive: true }).select('email');

  if (!user) {
    // Perform equivalent local token work without storing or exposing a value.
    hashPasswordResetToken(generatePasswordResetToken());
    return;
  }

  const token = generatePasswordResetToken();
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_LIMITS.TOKEN_EXPIRY_MS);
  const updateResult = await User.updateOne(
    { _id: user._id, isActive: true },
    {
      $set: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    },
    { runValidators: true },
  );

  if (updateResult.modifiedCount === 1) {
    deliverResetInstructions({ req, user, token, tokenHash });
  }
};

export const consumePasswordResetToken = async ({ token, password }) => {
  const tokenHash = hashPasswordResetToken(token);
  const passwordChangedAt = new Date();
  const existingUser = await User.findOne({
    isActive: true,
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: passwordChangedAt },
  }).select('+passwordHash +passwordHistoryHashes');

  if (!existingUser) {
    throw createInvalidResetTokenError();
  }

  const replacement = await buildPasswordReplacement({
    candidatePassword: password,
    currentHash: existingUser.passwordHash,
    historyHashes: existingUser.passwordHistoryHashes,
    changedAt: passwordChangedAt,
  });

  const user = await User.findOneAndUpdate(
    {
      _id: existingUser._id,
      isActive: true,
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: passwordChangedAt },
      passwordHash: existingUser.passwordHash,
    },
    {
      $set: { ...replacement, failedLoginAttempts: 0 },
      $unset: {
        lockedUntil: '',
        passwordResetTokenHash: '',
        passwordResetExpiresAt: '',
      },
      $inc: { authVersion: 1 },
    },
    {
      new: true,
      runValidators: true,
    },
  ).select('+authVersion');

  if (!user) {
    throw createInvalidResetTokenError();
  }

  return user;
};
