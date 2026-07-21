import axios from 'axios';

import { getAuthApiError } from '../../auth/utils/apiError.js';

const EXPORT_FILENAME_PREFIX = 'lexsecure-account-export';

export const saveAccountExport = (blob) => {
  const date = new Date().toISOString().slice(0, 10);
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');

  link.href = objectUrl;
  link.download = `${EXPORT_FILENAME_PREFIX}-${date}.json`;
  link.style.display = 'none';
  window.document.body.appendChild(link);
  link.click();
  link.remove();

  // The temporary URL is useful only for this user-initiated download.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};

export const getAccountExportErrorMessage = async (error) => {
  const fallbackMessage = 'Your account export could not be downloaded.';

  if (
    axios.isAxiosError(error)
    && error.response?.data instanceof Blob
    && error.response.data.type.includes('application/json')
  ) {
    try {
      const payload = JSON.parse(await error.response.data.text());

      if (typeof payload.message === 'string') return payload.message;
    } catch {
      return fallbackMessage;
    }
  }

  return getAuthApiError(error, fallbackMessage).message;
};
