import mongoose from 'mongoose';

import {
  APPOINTMENT_DURATION_LIMITS_MS,
  APPOINTMENT_STATUS,
  APPOINTMENT_STATUS_VALUES,
  CONSULTATION_TYPE_VALUES,
} from '../constants/appointment.js';
import { USER_ROLES } from '../constants/user-roles.js';
import { LawyerProfile } from './LawyerProfile.model.js';
import { User } from './User.model.js';

const { Schema, model } = mongoose;

const TIMEZONE_PATTERN = /^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/;

const appointmentSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      validate: {
        async validator(clientId) {
          return Boolean(await User.exists({
            _id: clientId,
            role: USER_ROLES.CLIENT,
          }));
        },
        message: 'Appointment client must reference an existing client account.',
      },
    },
    lawyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      validate: {
        async validator(lawyerId) {
          return Boolean(await User.exists({
            _id: lawyerId,
            role: USER_ROLES.LAWYER,
          }));
        },
        message: 'Appointment lawyer must reference an existing lawyer account.',
      },
    },
    lawyerProfile: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: true,
      immutable: true,
      validate: {
        async validator(profileId) {
          if (!this.lawyer) {
            return false;
          }

          return Boolean(await LawyerProfile.exists({
            _id: profileId,
            user: this.lawyer,
          }));
        },
        message: 'Appointment profile must belong to the selected lawyer.',
      },
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
      validate: {
        validator(endTime) {
          if (!(this.startsAt instanceof Date) || !(endTime instanceof Date)) {
            return false;
          }

          const duration = endTime.getTime() - this.startsAt.getTime();

          return (
            duration >= APPOINTMENT_DURATION_LIMITS_MS.MINIMUM
            && duration <= APPOINTMENT_DURATION_LIMITS_MS.MAXIMUM
          );
        },
        message: 'Appointment duration must be between 15 minutes and 4 hours.',
      },
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      match: TIMEZONE_PATTERN,
    },
    consultationType: {
      type: String,
      enum: CONSULTATION_TYPE_VALUES,
      required: true,
    },
    legalIssueSummary: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 1000,
      select: false,
    },
    status: {
      type: String,
      enum: APPOINTMENT_STATUS_VALUES,
      default: APPOINTMENT_STATUS.PENDING,
      required: true,
      index: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 500,
      select: false,
    },
    cancelledByRole: {
      type: String,
      enum: [USER_ROLES.CLIENT, USER_ROLES.LAWYER],
      select: false,
    },
    cancelledAt: {
      type: Date,
    },
    rescheduledAt: {
      type: Date,
    },
    rescheduleCount: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    reservedTimeBlocks: {
      type: [Date],
      default: undefined,
      select: false,
    },
    isSlotReserved: {
      type: Boolean,
      default: false,
      required: true,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

appointmentSchema.pre('validate', function validateFutureStart(next) {
  /*
   * Only new or rescheduled appointments must be in the future. Applying this
   * check to every save would prevent historical appointments being completed.
   */
  if (
    (this.isNew || this.isModified('startsAt'))
    && this.startsAt instanceof Date
    && this.startsAt.getTime() <= Date.now()
  ) {
    this.invalidate('startsAt', 'Appointment start time must be in the future.');
  }

  next();
});

/*
 * Schedule indexes support history queries. The unique multikey indexes reserve
 * every touched 15-minute block for both participants, closing the race between
 * the availability check and concurrent appointment creation.
 */
appointmentSchema.index({ lawyer: 1, startsAt: 1, endsAt: 1, status: 1 });
appointmentSchema.index({ client: 1, startsAt: -1, status: 1 });
appointmentSchema.index({ lawyer: 1, startsAt: -1, status: 1 });
appointmentSchema.index(
  { lawyer: 1, reservedTimeBlocks: 1 },
  {
    unique: true,
    partialFilterExpression: { isSlotReserved: true },
  },
);
appointmentSchema.index(
  { client: 1, reservedTimeBlocks: 1 },
  {
    unique: true,
    partialFilterExpression: { isSlotReserved: true },
  },
);

appointmentSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.legalIssueSummary;
    delete returnedObject.cancellationReason;
    delete returnedObject.cancelledByRole;
    delete returnedObject.reservedTimeBlocks;
    delete returnedObject.isSlotReserved;
    return returnedObject;
  },
});

export const Appointment = model('Appointment', appointmentSchema);
