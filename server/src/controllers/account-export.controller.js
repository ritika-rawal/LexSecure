import { ACCOUNT_EXPORT_LIMITS } from '../constants/account-export.js';
import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { createAccountExport as createAccountExportService } from '../services/account-export.service.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';

const EXPORT_FILENAME = 'lexsecure-account-export.json';

export const downloadAccountExport = async (req, res) => {
  const accountExport = await createAccountExportService(req.user);
  const exportBuffer = Buffer.from(
    `${JSON.stringify(accountExport, null, 2)}\n`,
    'utf8',
  );

  if (exportBuffer.length > ACCOUNT_EXPORT_LIMITS.MAXIMUM_BYTES) {
    const error = new Error(
      'The account export is too large for an immediate download.',
    );
    error.statusCode = 413;
    throw error;
  }

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.ACCOUNT_DATA_EXPORTED,
    targetType: AUDIT_TARGET_TYPES.USER,
    targetId: req.user.id,
  });

  res.set({
    'Cache-Control': 'private, no-store',
    'Content-Length': exportBuffer.length,
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.attachment(EXPORT_FILENAME);
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.status(200).send(exportBuffer);
};
