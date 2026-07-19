import { randomUUID } from 'node:crypto';
import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { APPOINTMENT_STATUS } from '../constants/appointment.js';
import { Appointment } from '../models/Appointment.model.js';
import { Document } from '../models/Document.model.js';
import {
  decryptDocument,
  encryptDocument,
} from '../utils/document-crypto.js';
import { validateDocumentContent } from '../utils/document-file.js';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const documentStorageDirectory = resolve(
  currentDirectory,
  '../../storage/documents',
);
const STORED_DOCUMENT_NAME_PATTERN = /^[0-9a-f-]{36}\.bin$/;

const createDocumentNotFoundError = () => {
  const error = new Error('Document not found.');
  error.statusCode = 404;
  return error;
};

const createUploadAppointmentNotFoundError = () => {
  const error = new Error('Appointment is not available for document upload.');
  error.statusCode = 404;
  return error;
};

const createDocumentStorageError = (cause) => {
  const error = new Error('Document storage is unavailable.', { cause });
  error.statusCode = 500;
  return error;
};

const resolveStoredDocumentPath = (storedName) => {
  if (!STORED_DOCUMENT_NAME_PATTERN.test(storedName)) {
    throw createDocumentNotFoundError();
  }

  const storedPath = resolve(documentStorageDirectory, storedName);

  if (dirname(storedPath) !== documentStorageDirectory) {
    throw createDocumentNotFoundError();
  }

  return storedPath;
};

const requireAppointmentParticipant = async ({
  appointmentId,
  userId,
}) => {
  const appointmentExists = await Appointment.exists({
    _id: appointmentId,
    $or: [
      { client: userId },
      { lawyer: userId },
    ],
  });

  if (!appointmentExists) {
    throw createDocumentNotFoundError();
  }
};

export const uploadAppointmentDocument = async ({
  appointmentId,
  clientId,
  file,
}) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    client: clientId,
    status: {
      $in: [
        APPOINTMENT_STATUS.PENDING,
        APPOINTMENT_STATUS.APPROVED,
      ],
    },
  }).select('_id');

  if (!appointment) {
    throw createUploadAppointmentNotFoundError();
  }

  if (!file) {
    const error = new Error(
      'A document file is required in the document form field.',
    );
    error.statusCode = 400;
    throw error;
  }

  const validatedType = await validateDocumentContent(file);
  const {
    encryptedBuffer,
    encryptionIv,
    encryptionAuthTag,
    contentHash,
  } = encryptDocument(file.buffer);
  const storedName = `${randomUUID()}.bin`;
  const storedPath = resolveStoredDocumentPath(storedName);

  await mkdir(documentStorageDirectory, { recursive: true });
  await writeFile(storedPath, encryptedBuffer, {
    flag: 'wx',
    mode: 0o600,
  });

  try {
    const document = await Document.create({
      appointment: appointment._id,
      uploadedBy: clientId,
      originalName: validatedType.originalName,
      storedName,
      mimeType: validatedType.mimeType,
      extension: validatedType.extension,
      size: file.size,
      contentHash,
      encryptionIv,
      encryptionAuthTag,
    });

    await document.populate('uploadedBy', 'fullName role');
    return document;
  } catch (error) {
    await unlink(storedPath).catch(() => {});
    throw error;
  }
};

export const listAppointmentDocuments = async ({
  appointmentId,
  userId,
  page,
  limit,
}) => {
  await requireAppointmentParticipant({ appointmentId, userId });

  const filter = { appointment: appointmentId };
  const skip = (page - 1) * limit;
  const [documents, totalItems] = await Promise.all([
    Document.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'fullName role')
      .exec(),
    Document.countDocuments(filter),
  ]);

  return {
    documents,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};

export const getAuthorizedDocumentDownload = async ({
  documentId,
  userId,
}) => {
  const document = await Document.findById(documentId).select(
    '+storedName +contentHash +encryptionIv +encryptionAuthTag',
  );

  if (!document) {
    throw createDocumentNotFoundError();
  }

  await requireAppointmentParticipant({
    appointmentId: document.appointment,
    userId,
  });

  let encryptedBuffer;

  try {
    encryptedBuffer = await readFile(
      resolveStoredDocumentPath(document.storedName),
    );
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw createDocumentNotFoundError();
    }

    throw createDocumentStorageError(error);
  }

  const plainBuffer = decryptDocument({
    encryptedBuffer,
    encryptionIv: document.encryptionIv,
    encryptionAuthTag: document.encryptionAuthTag,
    expectedContentHash: document.contentHash,
  });

  return {
    document,
    plainBuffer,
  };
};
