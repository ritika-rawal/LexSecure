export const MAXIMUM_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

export const DOCUMENT_FILE_TYPES = Object.freeze({
  pdf: Object.freeze({
    extension: '.pdf',
    mimeType: 'application/pdf',
  }),
  docx: Object.freeze({
    extension: '.docx',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }),
  txt: Object.freeze({
    extension: '.txt',
    mimeType: 'text/plain',
  }),
  jpg: Object.freeze({
    extension: '.jpg',
    mimeType: 'image/jpeg',
  }),
  jpeg: Object.freeze({
    extension: '.jpeg',
    mimeType: 'image/jpeg',
  }),
  png: Object.freeze({
    extension: '.png',
    mimeType: 'image/png',
  }),
});

export const DOCUMENT_EXTENSION_VALUES = Object.freeze(
  Object.values(DOCUMENT_FILE_TYPES).map(({ extension }) => extension),
);

export const DOCUMENT_MIME_TYPE_VALUES = Object.freeze([
  ...new Set(
    Object.values(DOCUMENT_FILE_TYPES).map(({ mimeType }) => mimeType),
  ),
]);
