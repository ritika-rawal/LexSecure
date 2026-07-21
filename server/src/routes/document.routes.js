import { Router } from 'express';

import { USER_ROLES } from '../constants/user-roles.js';
import {
  downloadDocument,
  listAppointmentDocuments,
  uploadAppointmentDocument,
} from '../controllers/document.controller.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../middleware/auth.middleware.js';
import { uploadSingleDocument } from '../middleware/document-upload.middleware.js';
import { validateRequest } from '../middleware/validate-request.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  appointmentDocumentParamValidator,
  downloadDocumentValidator,
  listAppointmentDocumentsValidator,
} from '../validators/document.validator.js';

const router = Router();

router.post(
  '/appointments/:appointmentId/documents',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT),
  appointmentDocumentParamValidator,
  validateRequest,
  uploadSingleDocument,
  asyncHandler(uploadAppointmentDocument),
);

router.get(
  '/appointments/:appointmentId/documents',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER),
  listAppointmentDocumentsValidator,
  validateRequest,
  asyncHandler(listAppointmentDocuments),
);

router.get(
  '/documents/:documentId/download',
  asyncHandler(requireAuthentication),
  authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER),
  downloadDocumentValidator,
  validateRequest,
  asyncHandler(downloadDocument),
);

export default router;
