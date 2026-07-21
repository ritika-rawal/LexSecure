import axios from 'axios';

const formatRetryAfter = (value) => {
  const seconds = Number.parseInt(value, 10);

  if (!Number.isInteger(seconds) || seconds < 1) return '';

  if (seconds < 60) return `${seconds} seconds`;

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
};

export const getAuthApiError = (error, fallbackMessage) => {
  if (!axios.isAxiosError(error)) {
    return { code: '', message: 'Something went wrong. Please try again.', fieldErrors: {} };
  }

  if (!error.response) {
    return {
      code: '',
      message: 'Unable to reach LexSecure. Check that the backend is running.',
      fieldErrors: {},
    };
  }

  const details = Array.isArray(error.response.data?.details)
    ? error.response.data.details
    : [];

  const fieldErrors = details.reduce((errors, detail) => {
    if (typeof detail.field === 'string' && typeof detail.message === 'string') {
      errors[detail.field] = detail.message;
    }

    return errors;
  }, {});

  const responseMessage = error.response.data?.message || fallbackMessage;
  const retryAfter =
    error.response.status === 429
      ? formatRetryAfter(error.response.headers['retry-after'])
      : '';

  return {
    code: error.response.data?.code || '',
    message: retryAfter
      ? `${responseMessage} Retry after ${retryAfter}.`
      : responseMessage,
    fieldErrors,
  };
};
