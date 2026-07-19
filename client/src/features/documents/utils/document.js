import {
  DOCUMENT_FILE_TYPES,
  MAXIMUM_DOCUMENT_SIZE_BYTES,
} from '../constants/document.js';

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export const validateDocumentFile = (file) => {
  if (!(file instanceof File)) {
    return 'Select a document to upload.';
  }

  const filename = file.name.trim();
  const finalDotIndex = filename.lastIndexOf('.');
  const filenameStem = filename.slice(0, finalDotIndex);
  const extension = filename.slice(finalDotIndex).toLowerCase();
  const expectedMimeType = DOCUMENT_FILE_TYPES[extension];

  if (
    !filename
    || filename.length > 255
    || finalDotIndex <= 0
    || filenameStem.includes('.')
    || CONTROL_CHARACTER_PATTERN.test(filename)
  ) {
    return 'Use a valid filename with one approved extension.';
  }

  if (!expectedMimeType || file.type !== expectedMimeType) {
    return 'Choose a PDF, DOCX, TXT, JPG, JPEG, or PNG document.';
  }

  if (file.size < 1) {
    return 'The selected document is empty.';
  }

  if (file.size > MAXIMUM_DOCUMENT_SIZE_BYTES) {
    return 'Document must not exceed 5 MB.';
  }

  return '';
};

export const formatDocumentSize = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDocumentDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
