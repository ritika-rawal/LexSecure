import mongoose from 'mongoose';

import { NOTIFICATION_TYPE_VALUES } from '../constants/notification.js';

const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      immutable: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPE_VALUES,
      required: true,
      immutable: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      immutable: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
      immutable: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    eventKey: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1 });

notificationSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.eventKey;
    return returnedObject;
  },
});

export const Notification = model('Notification', notificationSchema);
