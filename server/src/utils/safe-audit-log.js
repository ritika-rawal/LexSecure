export const buildSafeAuditLogResponse = (auditLog, integrityValid) =>
  Object.freeze({
    eventId: auditLog.eventId,
    requestId: auditLog.requestId,
    actor: Object.freeze({
      id:
        auditLog.actor?._id?.toString()
        || auditLog.actor?.toString()
        || null,
      fullName:
        auditLog.actor?.fullName
        || (
          auditLog.actorRole === 'anonymous'
            ? 'Anonymous'
            : auditLog.actorRole === 'system'
              ? 'System'
              : 'Account unavailable'
        ),
      role: auditLog.actorRole,
    }),
    action: auditLog.action,
    outcome: auditLog.outcome,
    target: Object.freeze({
      type: auditLog.targetType,
      id: auditLog.targetId,
    }),
    sourceReference: auditLog.sourceHash?.slice(0, 12) || 'unavailable',
    subjectReference: auditLog.subjectHash?.slice(0, 12) || null,
    integrityStatus: integrityValid ? 'verified' : 'failed',
    createdAt: auditLog.createdAt,
  });
