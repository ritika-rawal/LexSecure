import { validateStrongPassword } from './password.validation.js';

export const validatePasswordChange = ({
  currentPassword,
  newPassword,
  confirmPassword,
}) => {
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword = 'Enter your current password.';
  } else if (currentPassword.length > 128) {
    errors.currentPassword = 'Current password must not exceed 128 characters.';
  }

  const newPasswordError = validateStrongPassword(newPassword);
  if (newPasswordError) errors.newPassword = newPasswordError;

  if (!confirmPassword) {
    errors.confirmPassword = 'Confirm your new password.';
  } else if (newPassword !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
};
