import multer from 'multer';

import { MAXIMUM_DOCUMENT_SIZE_BYTES } from '../constants/document.js';
import { validateDeclaredDocumentFile } from '../utils/document-file.js';

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, callback) {
    try {
      validateDeclaredDocumentFile(file);
      callback(null, true);
    } catch (error) {
      callback(error);
    }
  },
  limits: {
    fileSize: MAXIMUM_DOCUMENT_SIZE_BYTES,
    files: 1,
    fields: 0,
    parts: 1,
    fieldNameSize: 32,
    headerPairs: 100,
    fieldNestingDepth: 0,
  },
});

const singleDocumentUpload = upload.single('document');

export const uploadSingleDocument = (req, res, next) => {
  singleDocumentUpload(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      error.statusCode = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      error.message =
        error.code === 'LIMIT_FILE_SIZE'
          ? 'Document must not exceed 5 MB.'
          : 'Document upload request is invalid.';
    }

    next(error);
  });
};
