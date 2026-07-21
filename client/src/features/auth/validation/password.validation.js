export const PASSWORD_REQUIREMENTS = Object.freeze([
  { id: 'length', label: '12 to 128 characters', test: (value) => value.length >= 12 && value.length <= 128 },
  { id: 'lowercase', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
  { id: 'uppercase', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
  { id: 'number', label: 'One number', test: (value) => /[0-9]/.test(value) },
  { id: 'symbol', label: 'One symbol', test: (value) => /[^A-Za-z0-9]/.test(value) },
]);

export const getPasswordStrength = (password) => {
  const requirements = PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(password),
  }));
  const metCount = requirements.filter(({ met }) => met).length;
  const label = metCount <= 2 ? 'Weak' : metCount <= 4 ? 'Fair' : 'Strong';

  return { label, metCount, requirements };
};

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
