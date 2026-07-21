import mongoose from 'mongoose';

import {
  DOCUMENT_EXTENSION_VALUES,
  DOCUMENT_MIME_TYPE_VALUES,
  MAXIMUM_DOCUMENT_SIZE_BYTES,
} from '../constants/document.js';

const { Schema, model } = mongoose;

const documentSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      immutable: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 255,
      immutable: true,
    },
    storedName: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: /^[0-9a-f-]{36}\.bin$/,
      select: false,
    },
    mimeType: {
      type: String,
      enum: DOCUMENT_MIME_TYPE_VALUES,
      required: true,
      immutable: true,
    },
    extension: {
      type: String,
      enum: DOCUMENT_EXTENSION_VALUES,
      required: true,
      immutable: true,
    },
    size: {
      type: Number,
      required: true,
      min: 1,
      max: MAXIMUM_DOCUMENT_SIZE_BYTES,
      immutable: true,
    },
    contentHash: {
      type: String,
      required: true,
      match: /^[a-f0-9]{64}$/,
      immutable: true,
      select: false,
    },
    encryptionIv: {
      type: String,
      required: true,
      immutable: true,
      select: false,
    },
    encryptionAuthTag: {
      type: String,
      required: true,
      immutable: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

documentSchema.index({ appointment: 1, createdAt: -1 });

documentSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.storedName;
    delete returnedObject.contentHash;
    delete returnedObject.encryptionIv;
    delete returnedObject.encryptionAuthTag;
    return returnedObject;
  },
});

export const Document = model('Document', documentSchema);
