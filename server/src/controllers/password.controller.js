import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.config.js';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../constants/audit.js';
import { recordAuditEventWithoutBlocking } from '../services/audit.service.js';
import { changeUserPassword } from '../services/password-change.service.js';
import { destroySession } from '../utils/session.js';

export const changePassword = async (req, res) => {
  const user = await changeUserPassword({
    userId: req.user.id,
    ...req.body,
  });

  await recordAuditEventWithoutBlocking({
    req,
    actorId: user._id,
    actorRole: user.role,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: user._id,
  });

  // A password change revokes every existing session, including this one.
  await destroySession(req);
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully. Sign in again with your new password.',
  });
};
