import {
  createHmac,
  timingSafeEqual,
} from 'node:crypto';

import { appConfig } from '../config/app.config.js';

const createHmacDigest = (value) =>
  createHmac('sha256', appConfig.auditLogHmacKey)
    .update(value)
    .digest('hex');

const buildCanonicalEvent = (event) =>
  JSON.stringify({
    eventId: event.eventId,
    requestId: event.requestId,
    actor: event.actor?._id?.toString() || event.actor?.toString() || null,
    actorRole: event.actorRole,
    action: event.action,
    outcome: event.outcome,
    targetType: event.targetType,
    targetId: event.targetId?.toString() || null,
    sourceHash: event.sourceHash,
    subjectHash: event.subjectHash || null,
    createdAt: new Date(event.createdAt).toISOString(),
  });

export const createAuditSourceHash = ({ ipAddress, userAgent }) =>
  createHmacDigest(`${ipAddress || 'unknown'}\n${userAgent || 'unknown'}`);

export const createAuditSubjectHash = (subject) =>
  createHmacDigest(subject.trim().toLowerCase());

export const createAuditIntegrityHash = (event) =>
  createHmacDigest(buildCanonicalEvent(event));

export const verifyAuditIntegrity = (event) => {
  try {
    const expectedHash = createAuditIntegrityHash(event);
    const storedHash = event.integrityHash;

    if (
      typeof storedHash !== 'string'
      || !/^[a-f0-9]{64}$/.test(storedHash)
    ) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(storedHash, 'hex'),
      Buffer.from(expectedHash, 'hex'),
    );
  } catch {
    return false;
  }
};
