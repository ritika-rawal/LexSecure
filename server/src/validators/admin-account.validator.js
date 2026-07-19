const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_MAX_LENGTH = 254;
const FULL_NAME_MIN_LENGTH = 2;
const FULL_NAME_MAX_LENGTH = 100;

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validateAdminAccountInput = ({ fullName, email, password }) => {
  const errors = [];
  const normalizedFullName = typeof fullName === 'string' ? fullName.trim() : '';
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (
    normalizedFullName.length < FULL_NAME_MIN_LENGTH
    || normalizedFullName.length > FULL_NAME_MAX_LENGTH
  ) {
    errors.push(
      `ADMIN_FULL_NAME must be between ${FULL_NAME_MIN_LENGTH} and ${FULL_NAME_MAX_LENGTH} characters.`,
    );
  }

  if (
    normalizedEmail.length === 0
    || normalizedEmail.length > EMAIL_MAX_LENGTH
    || !isValidEmail(normalizedEmail)
  ) {
    errors.push('ADMIN_EMAIL must be a valid email address.');
  }

  if (typeof password !== 'string') {
    errors.push('ADMIN_PASSWORD is required.');
  } else {
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      errors.push(
        `ADMIN_PASSWORD must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters.`,
      );
    }
    if (!/[a-z]/.test(password)) {
      errors.push('ADMIN_PASSWORD must include at least one lowercase letter.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('ADMIN_PASSWORD must include at least one uppercase letter.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('ADMIN_PASSWORD must include at least one number.');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('ADMIN_PASSWORD must include at least one symbol.');
    }
  }

  if (errors.length > 0) {
    const error = new Error(errors.join('\n'));
    error.name = 'AdminAccountValidationError';
    throw error;
  }

  return {
    fullName: normalizedFullName,
    email: normalizedEmail,
    password,
  };
};
