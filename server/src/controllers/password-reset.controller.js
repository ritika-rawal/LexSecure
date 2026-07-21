import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.config.js';
import {
  AUDIT_ACTIONS,
  AUDIT_ACTOR_ROLES,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { PASSWORD_RESET_RESPONSE_MESSAGE } from '../constants/password-reset.js';
import { recordAuditEventWithoutBlocking } from '../services/audit.service.js';
import {
  consumePasswordResetToken,
  requestPasswordReset,
} from '../services/password-reset.service.js';
import { destroySession } from '../utils/session.js';

export const requestPasswordResetEmail = async (req, res) => {
  await requestPasswordReset({ req, email: req.body.email });

  res.status(202).json({
    status: 'success',
    message: PASSWORD_RESET_RESPONSE_MESSAGE,
  });
};

export const resetPassword = async (req, res) => {
  const user = await consumePasswordResetToken(req.body);

  await recordAuditEventWithoutBlocking({
    req,
    actorRole: AUDIT_ACTOR_ROLES.ANONYMOUS,
    action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETED,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: user._id,
  });

  await destroySession(req);
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully. Sign in with your new password.',
  });
};
