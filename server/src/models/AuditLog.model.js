import mongoose from 'mongoose';

import {
  AUDIT_ACTION_VALUES,
  AUDIT_ACTOR_ROLE_VALUES,
  AUDIT_OUTCOME_VALUES,
  AUDIT_TARGET_TYPE_VALUES,
} from '../constants/audit.js';

const { Schema, model } = mongoose;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

const auditLogSchema = new Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: UUID_PATTERN,
    },
    requestId: {
      type: String,
      required: true,
      immutable: true,
      match: UUID_PATTERN,
      index: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      immutable: true,
    },
    actorRole: {
      type: String,
      enum: AUDIT_ACTOR_ROLE_VALUES,
      required: true,
      immutable: true,
    },
    action: {
      type: String,
      enum: AUDIT_ACTION_VALUES,
      required: true,
      immutable: true,
      index: true,
    },
    outcome: {
      type: String,
      enum: AUDIT_OUTCOME_VALUES,
      required: true,
      immutable: true,
    },
    targetType: {
      type: String,
      enum: AUDIT_TARGET_TYPE_VALUES,
      required: true,
      immutable: true,
    },
    targetId: {
      type: String,
      default: null,
      maxlength: 64,
      immutable: true,
    },
    sourceHash: {
      type: String,
      required: true,
      immutable: true,
      match: SHA256_PATTERN,
      select: false,
    },
    subjectHash: {
      type: String,
      default: null,
      immutable: true,
      match: SHA256_PATTERN,
      select: false,
    },
    integrityHash: {
      type: String,
      required: true,
      immutable: true,
      match: SHA256_PATTERN,
      select: false,
    },
    createdAt: {
      type: Date,
      required: true,
      immutable: true,
      index: true,
    },
  },
  {
    collection: 'audit_logs',
    versionKey: false,
  },
);

auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

auditLogSchema.pre('save', function preventAuditUpdate(next) {
  if (!this.isNew) {
    next(new Error('Audit log records are append-only.'));
    return;
  }

  next();
});

[
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'findOneAndReplace',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
].forEach((operation) => {
  auditLogSchema.pre(operation, function preventAuditMutation(next) {
    next(new Error('Audit log records are append-only.'));
  });
});

auditLogSchema.pre(
  'deleteOne',
  { document: true, query: false },
  function preventAuditDocumentDeletion(next) {
    next(new Error('Audit log records are append-only.'));
  },
);

auditLogSchema.pre('insertMany', function preventAuditBatchInsert(next) {
  next(new Error('Audit log records must use the audited append service.'));
});

auditLogSchema.pre('bulkWrite', function preventAuditBulkMutation(next) {
  next(new Error('Audit log bulk operations are not allowed.'));
});

auditLogSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.sourceHash;
    delete returnedObject.subjectHash;
    delete returnedObject.integrityHash;
    return returnedObject;
  },
});

export const AuditLog = model('AuditLog', auditLogSchema);
