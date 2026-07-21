import { clearFailedLoginAttempts } from './login-security.service.js';
import { regenerateSession, saveSession } from '../utils/session.js';

export const establishAuthenticatedSession = async ({ req, user }) => {
  const lastLoginAt = new Date();

  await clearFailedLoginAttempts(user._id, lastLoginAt);
  await regenerateSession(req);
  req.session.user = { id: user.id, role: user.role };
  await saveSession(req);

  user.lastLoginAt = lastLoginAt;
  return user;
};
