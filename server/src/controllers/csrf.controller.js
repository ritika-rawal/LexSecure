import { getOrCreateCsrfToken } from '../utils/csrf-token.js';
import { saveSession } from '../utils/session.js';

export const getCsrfToken = async (req, res) => {
  const csrfToken = getOrCreateCsrfToken(req.session);

  // Persist before responding so the next unsafe request can be verified.
  await saveSession(req);

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    data: { csrfToken },
  });
};
