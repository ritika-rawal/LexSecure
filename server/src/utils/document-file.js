import { fileTypeFromBuffer } from 'file-type';

import { DOCUMENT_FILE_TYPES } from '../constants/document.js';

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

const createInvalidDocumentError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const getSafeOriginalName = (originalName) => {
  if (typeof originalName !== 'string') {
    throw createInvalidDocumentError('Document filename is invalid.');
  }

  const trimmedName = originalName.trim();
  const baseName = trimmedName.split(/[\\/]/).pop();

  if (
    !baseName
    || baseName !== trimmedName
    || baseName.length > 255
    || CONTROL_CHARACTER_PATTERN.test(baseName)
  ) {
    throw createInvalidDocumentError('Document filename is invalid.');
  }

  return baseName;
};

const getDeclaredFileType = ({ originalname, mimetype }) => {
  const originalName = getSafeOriginalName(originalname);
  const finalDotIndex = originalName.lastIndexOf('.');

  if (finalDotIndex <= 0) {
    throw createInvalidDocumentError(
      'Document must use an approved file extension.',
    );
  }

  const filenameStem = originalName.slice(0, finalDotIndex);
  const extension = originalName.slice(finalDotIndex).toLowerCase();
  const fileType = Object.values(DOCUMENT_FILE_TYPES).find(
    (candidate) => candidate.extension === extension,
  );

  if (filenameStem.includes('.')) {
    throw createInvalidDocumentError(
      'Document filenames must not contain multiple extensions.',
    );
  }

  if (!fileType || mimetype !== fileType.mimeType) {
    throw createInvalidDocumentError(
      'Document extension and declared content type are not allowed.',
    );
  }

  return {
    originalName,
    extension,
    mimeType: fileType.mimeType,
  };
};

const isValidUtf8Text = (buffer) => {
  if (buffer.includes(0)) return false;

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
};

export const validateDeclaredDocumentFile = (file) => {
  getDeclaredFileType(file);
};

export const validateDocumentContent = async (file) => {
  const declaredType = getDeclaredFileType(file);

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw createInvalidDocumentError('Document must not be empty.');
  }

  if (declaredType.extension === '.txt') {
    if (!isValidUtf8Text(file.buffer)) {
      throw createInvalidDocumentError(
        'Text documents must contain valid UTF-8 text.',
      );
    }

    return declaredType;
  }

  const detectedType = await fileTypeFromBuffer(file.buffer);
  const detectedExtensionMatches =
    detectedType?.ext === declaredType.extension.slice(1)
    || (
      ['.jpg', '.jpeg'].includes(declaredType.extension)
      && detectedType?.ext === 'jpg'
    );

  if (
    !detectedType
    || !detectedExtensionMatches
    || detectedType.mime !== declaredType.mimeType
  ) {
    throw createInvalidDocumentError(
      'Document content does not match its approved file type.',
    );
  }

  return declaredType;
};
