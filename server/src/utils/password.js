import bcrypt from 'bcrypt';

const PASSWORD_SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

export const verifyPassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};
