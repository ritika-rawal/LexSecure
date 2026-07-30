import { appConfig } from '../config/app.config.js';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { EMAIL_VERIFICATION_LIMITS } from '../constants/email-verification.js';
import { User } from '../models/User.model.js';
import { recordAuditEventWithoutBlocking } from './audit.service.js';
import { sendVerificationEmail } from './email.service.js';
import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
} from '../utils/email-verification-token.js';

const createInvalidVerificationTokenError = () => {
  const error = new Error('Verification link is invalid or has expired.');
  error.statusCode = 400;
  return error;
};

const createVerificationUrl = (token) => {
  const url = new URL('/verify-email', appConfig.clientOrigins[0]);
  url.searchParams.set('token', token);
  return url.toString();
};

const deliverVerificationEmail = ({ req, user, token, tokenHash }) => {
  setImmediate(async () => {
    try {
      await sendVerificationEmail({
        recipient: user.email,
        verificationUrl: createVerificationUrl(token),
      });
      await recordAuditEventWithoutBlocking({
        req,
        actorId: user._id,
        actorRole: user.role,
        action: AUDIT_ACTIONS.EMAIL_VERIFICATION_REQUESTED,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: user._id,
      });
    } catch {
      await User.updateOne(
        { _id: user._id, emailVerificationTokenHash: tokenHash },
        {
          $unset: {
            emailVerificationTokenHash: '',
            emailVerificationExpiresAt: '',
          },
        },
      );
      await recordAuditEventWithoutBlocking({
        req,
        actorRole: AUDIT_ACTOR_ROLES.SYSTEM,
        action: AUDIT_ACTIONS.EMAIL_VERIFICATION_DELIVERY_FAILED,
        outcome: AUDIT_OUTCOMES.FAILURE,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId: user._id,
      });
      console.error('Email verification delivery failed.');
    }
  });
};

export const issueEmailVerificationToken = async ({ req, user }) => {
  const token = generateEmailVerificationToken();
  const tokenHash = hashEmailVerificationToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_LIMITS.TOKEN_EXPIRY_MS);

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    },
    { runValidators: true },
  );

  deliverVerificationEmail({ req, user, token, tokenHash });
};

export const consumeEmailVerificationToken = async ({ req, token }) => {
  const tokenHash = hashEmailVerificationToken(token);

  const user = await User.findOneAndUpdate(
    {
      isActive: true,
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() },
    },
    {
      $set: { isEmailVerified: true },
      $unset: {
        emailVerificationTokenHash: '',
        emailVerificationExpiresAt: '',
      },
    },
    { new: true },
  );

  if (!user) {
    await recordAuditEventWithoutBlocking({
      req,
      actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
      action: AUDIT_ACTIONS.EMAIL_VERIFICATION_FAILED,
      outcome: AUDIT_OUTCOMES.FAILURE,
      targetType: AUDIT_TARGET_TYPES.USER,
    });
    throw createInvalidVerificationTokenError();
  }

  await recordAuditEventWithoutBlocking({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.EMAIL_VERIFICATION_COMPLETED,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: user._id,
  });

  return user;
};
