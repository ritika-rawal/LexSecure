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

  if (values.password.length < 12 || values.password.length > 128) {
    errors.password = 'Password must be between 12 and 128 characters.';
  } else if (!/[a-z]/.test(values.password)) {
    errors.password = 'Password must include a lowercase letter.';
  } else if (!/[A-Z]/.test(values.password)) {
    errors.password = 'Password must include an uppercase letter.';
  } else if (!/[0-9]/.test(values.password)) {
    errors.password = 'Password must include a number.';
  } else if (!/[^A-Za-z0-9]/.test(values.password)) {
    errors.password = 'Password must include a symbol.';
  }

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
