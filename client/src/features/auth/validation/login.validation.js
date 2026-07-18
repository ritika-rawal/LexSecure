const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MAX_LENGTH = 128;

export const validateLogin = (values) => {
  const errors = {};
  const email = values.email.trim();

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Enter your password.';
  } else if (values.password.length > PASSWORD_MAX_LENGTH) {
    errors.password = `Password must not exceed ${PASSWORD_MAX_LENGTH} characters.`;
  }

  return errors;
};
