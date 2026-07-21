import { validateStrongPassword } from './password.validation.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = new Set(['client', 'lawyer']);

export const validateRegistration = (values) => {
  const errors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();

  if (fullName.length < 2 || fullName.length > 100) {
    errors.fullName = 'Full name must be between 2 and 100 characters.';
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = 'Enter a valid email address.';
  }

  const passwordError = validateStrongPassword(values.password);
  if (passwordError) errors.password = passwordError;

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password.';
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (!ALLOWED_ROLES.has(values.role)) {
    errors.role = 'Choose either Client or Lawyer.';
  }

  return errors;
};
