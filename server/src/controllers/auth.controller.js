import { SESSION_COOKIE_NAME, sessionCookieOptions } from '../config/session.config.js';
import { User } from '../models/User.model.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

const buildSafeUserResponse = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  isEmailVerified: user.isEmailVerified,
  mfaEnabled: user.mfaEnabled,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const regenerateSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const saveSession = (req) =>
  new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const destroySession = (req) =>
  new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

const createInvalidCredentialsError = () => {
  const error = new Error('Invalid email or password.');
  error.statusCode = 401;
  return error;
};

export const registerUser = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await User.exists({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  let user;

  try {
    user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role,
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateEmailError = new Error('An account with this email already exists.');
      duplicateEmailError.statusCode = 409;
      throw duplicateEmailError;
    }

    throw error;
  }

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully.',
    data: {
      user: buildSafeUserResponse(user),
    },
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) {
    throw createInvalidCredentialsError();
  }

  if (!user.isActive) {
    const error = new Error('This account is disabled.');
    error.statusCode = 403;
    throw error;
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw createInvalidCredentialsError();
  }

  await regenerateSession(req);

  req.session.user = {
    id: user.id,
    role: user.role,
  };

  user.lastLoginAt = new Date();
  await user.save();
  await saveSession(req);

  res.status(200).json({
    status: 'success',
    message: 'User logged in successfully.',
    data: {
      user: buildSafeUserResponse(user),
    },
  });
};

export const logoutUser = async (req, res) => {
  await destroySession(req);

  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
  res.status(204).send();
};

export const getCurrentUser = async (req, res) => {
  if (!req.session.user?.id) {
    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }

  const user = await User.findById(req.session.user.id);

  if (!user || !user.isActive) {
    await destroySession(req);

    const error = new Error('Authentication required.');
    error.statusCode = 401;
    throw error;
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: buildSafeUserResponse(user),
    },
  });
};
