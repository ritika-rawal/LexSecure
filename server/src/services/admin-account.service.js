import { USER_ROLES } from '../constants/user-roles.js';
import { User } from '../models/User.model.js';
import { hashPassword } from '../utils/password.js';
import { validateAdminAccountInput } from '../validators/admin-account.validator.js';

const createDuplicateAccountError = () => {
  const error = new Error('An account with ADMIN_EMAIL already exists.');
  error.code = 'ADMIN_ACCOUNT_EXISTS';
  return error;
};

export const createInitialAdmin = async (input) => {
  const { fullName, email, password } = validateAdminAccountInput(input);

  if (await User.exists({ email })) {
    throw createDuplicateAccountError();
  }

  const passwordHash = await hashPassword(password);

  try {
    return await User.create({
      fullName,
      email,
      passwordHash,
      role: USER_ROLES.ADMIN,
      isActive: true,
    });
  } catch (error) {
    // The unique index remains the final protection against concurrent creation.
    if (error.code === 11000) {
      throw createDuplicateAccountError();
    }

    throw error;
  }
};
