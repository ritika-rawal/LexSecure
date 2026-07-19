import bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 12;

export const DUMMY_PASSWORD_HASH =
  '$2b$12$p9TKxQyfXYO06mtiuIMN1eK0UOpCpp9IRFK66wF9bO4GNKYfO01Ou';

export const hashPassword = async (password) => {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

export const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};
