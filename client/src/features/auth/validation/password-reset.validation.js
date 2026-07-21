import { validateStrongPassword } from './password.validation.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export const validatePasswordResetRequest = (email) => {
  const normalizedEmail = email.trim();
  return EMAIL_PATTERN.test(normalizedEmail) && normalizedEmail.length <= 254
    ? ''
    : 'Enter a valid email address.';
};

export const validateNewPassword = ({ password, confirmPassword }) => {
  const errors = {};
  const passwordError = validateStrongPassword(password);

  if (passwordError) errors.password = passwordError;

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your new password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};
