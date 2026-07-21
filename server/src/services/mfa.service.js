import QRCode from 'qrcode';
import {
  generateSecret,
  generateURI,
  verify,
} from 'otplib';

import {
  MFA_ISSUER,
  MFA_LIMITS,
  MFA_RECOVERY_CODE_PATTERN,
} from '../constants/mfa.js';
import { User } from '../models/User.model.js';
import {
  decryptMfaSecret,
  encryptMfaSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  normalizeRecoveryCode,
  recoveryCodeHashesMatch,
} from '../utils/mfa-crypto.js';
import { saveSession } from '../utils/session.js';

const createMfaConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

const verifyTotp = async ({ secret, code, afterTimeStep }) =>
  verify({
    secret,
    token: code,
    epochTolerance: MFA_LIMITS.TOTP_TOLERANCE_SECONDS,
    ...(Number.isInteger(afterTimeStep) ? { afterTimeStep } : {}),
  });

export const beginMfaSetup = async ({ req, user }) => {
  const existingUser = await User.findById(user.id).select('mfaEnabled');

  if (!existingUser || existingUser.mfaEnabled) {
    throw createMfaConflictError('MFA is already enabled for this account.');
  }

  const secret = generateSecret();
  const otpauthUri = generateURI({
    issuer: MFA_ISSUER,
    label: user.email,
    secret,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
  });

  req.session.mfaSetup = {
    userId: user.id,
    encryptedSecret: encryptMfaSecret({ secret, userId: user.id }),
    expiresAt: Date.now() + MFA_LIMITS.SETUP_EXPIRY_MS,
  };
  await saveSession(req);

  return { secret, qrCodeDataUrl };
};

export const enableMfa = async ({ req, user, code }) => {
  const setup = req.session?.mfaSetup;

  if (
    !setup
    || setup.userId !== user.id
    || setup.expiresAt <= Date.now()
  ) {
    delete req.session.mfaSetup;
    await saveSession(req);
    const error = new Error('MFA setup expired. Start setup again.');
    error.statusCode = 400;
    throw error;
  }

  const secret = decryptMfaSecret({
    encryptedSecret: setup.encryptedSecret,
    userId: user.id,
  });
  const verification = await verifyTotp({ secret, code });

  if (!verification.valid) {
    const error = new Error('Invalid authenticator code.');
    error.statusCode = 400;
    throw error;
  }

  const recoveryCodes = generateRecoveryCodes();
  const updateResult = await User.updateOne(
    { _id: user.id, mfaEnabled: false },
    {
      $set: {
        mfaEnabled: true,
        mfaSecret: setup.encryptedSecret,
        mfaRecoveryCodeHashes: recoveryCodes.map(hashRecoveryCode),
        mfaLastUsedTimeStep: verification.timeStep,
      },
    },
  );

  if (updateResult.modifiedCount !== 1) {
    throw createMfaConflictError('MFA could not be enabled for this account.');
  }

  delete req.session.mfaSetup;
  await saveSession(req);

  return recoveryCodes;
};

const consumeRecoveryCode = async ({ user, code }) => {
  const candidateHash = hashRecoveryCode(code);
  const matchingHash = user.mfaRecoveryCodeHashes?.find((storedHash) =>
    recoveryCodeHashesMatch(candidateHash, storedHash));

  if (!matchingHash) return false;

  const updateResult = await User.updateOne(
    {
      _id: user._id,
      mfaEnabled: true,
      mfaRecoveryCodeHashes: matchingHash,
    },
    { $pull: { mfaRecoveryCodeHashes: matchingHash } },
  );

  return updateResult.modifiedCount === 1;
};

export const verifyEnabledMfaCode = async ({ user, code }) => {
  if (MFA_RECOVERY_CODE_PATTERN.test(normalizeRecoveryCode(code))) {
    const valid = await consumeRecoveryCode({ user, code });
    return { valid, recoveryCodeUsed: valid };
  }

  const secret = decryptMfaSecret({
    encryptedSecret: user.mfaSecret,
    userId: user._id,
  });
  const verification = await verifyTotp({
    secret,
    code,
    afterTimeStep: user.mfaLastUsedTimeStep,
  });

  if (!verification.valid) {
    return { valid: false, recoveryCodeUsed: false };
  }

  const updateResult = await User.updateOne(
    {
      _id: user._id,
      mfaEnabled: true,
      $or: [
        { mfaLastUsedTimeStep: null },
        { mfaLastUsedTimeStep: { $lt: verification.timeStep } },
      ],
    },
    { $set: { mfaLastUsedTimeStep: verification.timeStep } },
  );

  return {
    valid: updateResult.modifiedCount === 1,
    recoveryCodeUsed: false,
  };
};

export const getMfaUser = (userId) =>
  User.findById(userId).select(
    '+mfaSecret +mfaRecoveryCodeHashes +mfaLastUsedTimeStep',
  );

export const getMfaManagementUser = (userId) =>
  User.findById(userId).select(
    '+passwordHash +mfaSecret +mfaRecoveryCodeHashes +mfaLastUsedTimeStep',
  );

export const disableMfa = async (userId) => {
  const updateResult = await User.updateOne(
    { _id: userId, mfaEnabled: true },
    {
      $set: { mfaEnabled: false },
      $unset: {
        mfaSecret: '',
        mfaRecoveryCodeHashes: '',
        mfaLastUsedTimeStep: '',
      },
    },
  );

  if (updateResult.modifiedCount !== 1) {
    throw createMfaConflictError('MFA is not enabled for this account.');
  }
};
