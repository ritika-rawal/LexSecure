import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { listAuditLogs as listAuditLogsService } from '../services/admin-audit.service.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

export const listAuditLogs = async (req, res) => {
  const result = await listAuditLogsService({
    action: req.query.action,
    outcome: req.query.outcome,
    actorRole: req.query.actorRole,
    targetType: req.query.targetType,
    requestId: req.query.requestId,
    targetId: req.query.targetId,
    from: req.query.from,
    to: req.query.to,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || DEFAULT_LIMIT,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.AUDIT_LOGS_VIEWED,
    targetType: AUDIT_TARGET_TYPES.AUDIT_LOG,
  });

  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({
    status: 'success',
    data: result,
  });
};
