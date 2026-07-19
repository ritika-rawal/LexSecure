export const MAXIMUM_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_FILE_TYPES = Object.freeze({
  '.pdf': 'application/pdf',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
});

export const DOCUMENT_ACCEPT_VALUE = Object.keys(DOCUMENT_FILE_TYPES).join(',');
export const DOCUMENT_PAGE_SIZE = 10;
