import { AuditLog } from '../models/AuditLog.model.js';
import { verifyAuditIntegrity } from '../utils/audit-integrity.js';
import { buildSafeAuditLogResponse } from '../utils/safe-audit-log.js';

export const listAuditLogs = async ({
  action,
  outcome,
  actorRole,
  targetType,
  requestId,
  targetId,
  from,
  to,
  page,
  limit,
}) => {
  const filter = {
    ...(action ? { action } : {}),
    ...(outcome ? { outcome } : {}),
    ...(actorRole ? { actorRole } : {}),
    ...(targetType ? { targetType } : {}),
    ...(requestId ? { requestId } : {}),
    ...(targetId ? { targetId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { $gte: from } : {}),
            ...(to ? { $lte: to } : {}),
          },
        }
      : {}),
  };
  const skip = (page - 1) * limit;
  const [auditLogs, totalItems] = await Promise.all([
    AuditLog.find(filter)
      .select('+sourceHash +subjectHash +integrityHash')
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    AuditLog.countDocuments(filter),
  ]);
  const integrityResults = auditLogs.map(verifyAuditIntegrity);
  const verifiedAuditLogs = auditLogs.filter(
    (auditLog, index) => integrityResults[index],
  );

  await AuditLog.populate(verifiedAuditLogs, {
    path: 'actor',
    select: 'fullName role',
  });

  return {
    auditLogs: auditLogs.map((auditLog, index) =>
      buildSafeAuditLogResponse(auditLog, integrityResults[index])),
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
