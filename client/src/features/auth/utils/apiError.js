import axios from 'axios';

export const getAuthApiError = (error, fallbackMessage) => {
  if (!axios.isAxiosError(error)) {
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
  }

  if (!error.response) {
    return {
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

  return {
    message: error.response.data?.message || fallbackMessage,
    fieldErrors,
  };
};
