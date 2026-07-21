import { randomUUID } from 'node:crypto';

import {
  AUDIT_ACTOR_ROLES,
  AUDIT_OUTCOMES,
} from '../constants/audit.js';
import { AuditLog } from '../models/AuditLog.model.js';
import {
  createAuditIntegrityHash,
  createAuditSourceHash,
  createAuditSubjectHash,
} from '../utils/audit-integrity.js';

export const recordAuditEvent = async ({
  req,
  actorId = null,
  actorRole = AUDIT_ACTOR_ROLES.ANONYMOUS,
  action,
  outcome = AUDIT_OUTCOMES.SUCCESS,
  targetType,
  targetId = null,
  subject = null,
}) => {
  const event = {
    eventId: randomUUID(),
    requestId: req.auditRequestId || randomUUID(),
    actor: actorId,
    actorRole,
    action,
    outcome,
    targetType,
    targetId: targetId?.toString() || null,
    sourceHash: createAuditSourceHash({
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }),
    subjectHash: subject ? createAuditSubjectHash(subject) : null,
    createdAt: new Date(),
  };

  event.integrityHash = createAuditIntegrityHash(event);
  return AuditLog.create(event);
};

export const recordAuditEventWithoutBlocking = async (event) => {
  try {
    await recordAuditEvent(event);
  } catch (error) {
    /*
     * The primary operation may already be committed. Returning a failure would
     * encourage a retry and could duplicate appointments, messages, or files.
     */
    console.error('Security audit event could not be recorded.', error.message);
  }
};

export const recordAuthenticatedAuditEvent = (req, event) =>
  recordAuditEventWithoutBlocking({
    ...event,
    req,
    actorId: req.user.id,
    actorRole: req.user.role,
  });
