import { User } from '../models/User.model.js';
import { buildPasswordReplacement } from './password-policy.service.js';
import { verifyPassword } from '../utils/password.js';

const createInvalidCurrentPasswordError = () => {
  const error = new Error('Current password is incorrect.');
  error.statusCode = 401;
  error.publicCode = 'CURRENT_PASSWORD_INVALID';
  return error;
};

export const changeUserPassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select(
    '+passwordHash +passwordHistoryHashes +authVersion',
  );

  if (!user || !user.isActive) throw createInvalidCurrentPasswordError();

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw createInvalidCurrentPasswordError();
  }

  const replacement = await buildPasswordReplacement({
    candidatePassword: newPassword,
    currentHash: user.passwordHash,
    historyHashes: user.passwordHistoryHashes,
  });

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, isActive: true, passwordHash: user.passwordHash },
    {
      $set: replacement,
      $unset: {
        lockedUntil: '',
        passwordResetTokenHash: '',
        passwordResetExpiresAt: '',
      },
      $inc: { authVersion: 1 },
    },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    const error = new Error('Password could not be changed. Sign in and try again.');
    error.statusCode = 409;
    throw error;
  }

  return updatedUser;
};
