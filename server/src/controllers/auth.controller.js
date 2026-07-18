import { User } from '../models/User.model.js';
import { hashPassword } from '../utils/password.js';

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
