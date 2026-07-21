import mongoose from 'mongoose';

import { MESSAGE_LENGTH_LIMITS } from '../constants/message.js';

const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      immutable: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    encryptedBody: {
      type: String,
      required: true,
      immutable: true,
      maxlength: 12_000,
      match: /^[A-Za-z0-9+/]+={0,2}$/,
      select: false,
    },
    encryptionIv: {
      type: String,
      required: true,
      immutable: true,
      match: /^[A-Za-z0-9+/]{16}$/,
      select: false,
    },
    encryptionAuthTag: {
      type: String,
      required: true,
      immutable: true,
      match: /^[A-Za-z0-9+/]{22}==$/,
      select: false,
    },
    bodyLength: {
      type: Number,
      required: true,
      immutable: true,
      min: MESSAGE_LENGTH_LIMITS.MINIMUM,
      max: MESSAGE_LENGTH_LIMITS.MAXIMUM,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

messageSchema.index({ appointment: 1, createdAt: -1, _id: -1 });
messageSchema.index({ recipient: 1, createdAt: -1 });

messageSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.encryptedBody;
    delete returnedObject.encryptionIv;
    delete returnedObject.encryptionAuthTag;
    return returnedObject;
  },
});

export const Message = model('Message', messageSchema);
