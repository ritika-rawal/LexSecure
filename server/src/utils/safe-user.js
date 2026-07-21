import { getPasswordExpiresAt } from '../services/password-policy.service.js';

export const buildSafeUserResponse = (user) =>
  Object.freeze({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    mfaEnabled: user.mfaEnabled,
    passwordExpiresAt: user.passwordExpiresAt
      || getPasswordExpiresAt(user.passwordChangedAt || user.createdAt),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
