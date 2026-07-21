import { appConfig } from '../config/app.config.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

export const PASSWORD_POLICY_ERROR_CODES = Object.freeze({
  REUSED: 'PASSWORD_REUSED',
  EXPIRED: 'PASSWORD_EXPIRED',
});

const createReusedPasswordError = () => {
  const error = new Error(
    `Choose a password that is different from your last ${appConfig.passwordPolicy.historySize} passwords.`,
  );
  error.statusCode = 400;
  error.publicCode = PASSWORD_POLICY_ERROR_CODES.REUSED;
  return error;
};

export const getPasswordExpiresAt = (changedAt = new Date()) =>
  new Date(
    changedAt.getTime()
      + appConfig.passwordPolicy.maxAgeDays * 24 * 60 * 60 * 1000,
  );

export const isPasswordExpired = (user, now = new Date()) => {
  if (user.passwordExpiresAt) return user.passwordExpiresAt <= now;

  const effectiveChangedAt = user.passwordChangedAt || user.createdAt;
  return Boolean(effectiveChangedAt && getPasswordExpiresAt(effectiveChangedAt) <= now);
};

export const assertPasswordNotReused = async ({
  candidatePassword,
  currentHash,
  historyHashes = [],
}) => {
  const retainedHashes = [currentHash, ...historyHashes]
    .filter(Boolean)
    .slice(0, appConfig.passwordPolicy.historySize + 1);
  const matches = await Promise.all(
    retainedHashes.map((passwordHash) => verifyPassword(candidatePassword, passwordHash)),
  );

  if (matches.some(Boolean)) throw createReusedPasswordError();
};

export const buildPasswordReplacement = async ({
  candidatePassword,
  currentHash,
  historyHashes = [],
  changedAt = new Date(),
}) => {
  await assertPasswordNotReused({ candidatePassword, currentHash, historyHashes });

  return {
    passwordHash: await hashPassword(candidatePassword),
    passwordChangedAt: changedAt,
    passwordExpiresAt: getPasswordExpiresAt(changedAt),
    passwordHistoryHashes: [currentHash, ...historyHashes]
      .filter(Boolean)
      .slice(0, appConfig.passwordPolicy.historySize),
  };
};
