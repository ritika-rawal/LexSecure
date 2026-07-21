import { MESSAGE_MAXIMUM_LENGTH } from '../constants/message.js';

const UNSAFE_CONTROL_CHARACTER_PATTERN =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export const validateMessage = (message) => {
  const normalizedMessage = typeof message === 'string' ? message.trim() : '';
  const characterCount = Array.from(normalizedMessage).length;

  if (characterCount < 1) {
    return 'Enter a message.';
  }

  if (characterCount > MESSAGE_MAXIMUM_LENGTH) {
    return `Message must not exceed ${MESSAGE_MAXIMUM_LENGTH} characters.`;
  }

  if (UNSAFE_CONTROL_CHARACTER_PATTERN.test(normalizedMessage)) {
    return 'Message contains unsupported control characters.';
  }

  return '';
};

export const countMessageCharacters = (message) =>
  Array.from(message).length;

export const formatMessageDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
