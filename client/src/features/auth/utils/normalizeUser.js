const ALLOWED_ROLES = new Set(['client', 'lawyer', 'admin']);

export const normalizeUser = (user) => {
  if (
    !user ||
    typeof user.id !== 'string' ||
    typeof user.fullName !== 'string' ||
    typeof user.email !== 'string' ||
    !ALLOWED_ROLES.has(user.role)
  ) {
    throw new Error('The authentication response contains invalid user data.');
  }

  return Object.freeze({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.isActive),
    isEmailVerified: Boolean(user.isEmailVerified),
    mfaEnabled: Boolean(user.mfaEnabled),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};
