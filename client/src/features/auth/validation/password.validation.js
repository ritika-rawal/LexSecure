export const validateStrongPassword = (password) => {
  if (password.length < 12 || password.length > 128) {
    return 'Password must be between 12 and 128 characters.';
  }

  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol.';
  return '';
};
