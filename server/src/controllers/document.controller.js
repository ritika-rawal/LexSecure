import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';
import {
  getAuthorizedDocumentDownload as getAuthorizedDocumentDownloadService,
  listAppointmentDocuments as listAppointmentDocumentsService,
  uploadAppointmentDocument as uploadAppointmentDocumentService,
} from '../services/document.service.js';
import { buildSafeDocumentResponse } from '../utils/safe-document.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const uploadAppointmentDocument = async (req, res) => {
  const document = await uploadAppointmentDocumentService({
    appointmentId: req.params.appointmentId,
    clientId: req.user.id,
    file: req.file,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
    targetType: AUDIT_TARGET_TYPES.DOCUMENT,
    targetId: document._id,
  });

  res.status(201).json({
    status: 'success',
    message: 'Document uploaded securely.',
    data: {
      document: buildSafeDocumentResponse(document),
    },
  });
};

export const listAppointmentDocuments = async (req, res) => {
  const result = await listAppointmentDocumentsService({
    appointmentId: req.params.appointmentId,
    userId: req.user.id,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || DEFAULT_LIMIT,
  });

  res.status(200).json({
    status: 'success',
    data: {
      documents: result.documents.map(buildSafeDocumentResponse),
      pagination: result.pagination,
    },
  });
};

export const downloadDocument = async (req, res) => {
  const { document, plainBuffer } =
    await getAuthorizedDocumentDownloadService({
      documentId: req.params.documentId,
      userId: req.user.id,
    });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.DOCUMENT_DOWNLOADED,
    targetType: AUDIT_TARGET_TYPES.DOCUMENT,
    targetId: document._id,
  });

  res.set({
    'Cache-Control': 'private, no-store',
    'Content-Length': plainBuffer.length,
    'Content-Type': document.mimeType,
  });
  res.attachment(document.originalName);
  res.set('Content-Type', document.mimeType);
  res.status(200).send(plainBuffer);
};
