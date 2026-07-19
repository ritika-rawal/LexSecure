import mongoose from 'mongoose';

import {
  LAWYER_APPROVAL_STATUS,
  LAWYER_APPROVAL_STATUS_VALUES,
  WEEK_DAYS,
} from '../constants/lawyer-profile.js';
import { USER_ROLES } from '../constants/user-roles.js';
import {
  isValidWeeklyAvailability,
  TIME_24_HOUR_PATTERN,
} from '../utils/availability.js';
import { User } from './User.model.js';

const { Schema, model } = mongoose;

const availabilitySlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: WEEK_DAYS,
      required: true,
    },
    startTime: {
      type: String,
      match: TIME_24_HOUR_PATTERN,
      required: true,
    },
    endTime: {
      type: String,
      match: TIME_24_HOUR_PATTERN,
      required: true,
    },
  },
  {
    _id: false,
  },
);

const lawyerProfileSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      immutable: true,
      validate: {
        async validator(userId) {
          const lawyerExists = await User.exists({
            _id: userId,
            role: USER_ROLES.LAWYER,
          });

          return Boolean(lawyerExists);
        },
        message: 'Lawyer profile must reference an existing lawyer account.',
      },
    },
    professionalTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    biography: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 2000,
    },
    specializations: {
      type: [
        {
          type: String,
          trim: true,
          minlength: 2,
          maxlength: 80,
        },
      ],
      required: true,
      validate: [
        {
          validator(values) {
            return values.length >= 1 && values.length <= 10;
          },
          message: 'Lawyer profile must include between 1 and 10 specializations.',
        },
        {
          validator(values) {
            const normalizedValues = values.map((value) => value.toLowerCase());
            return new Set(normalizedValues).size === normalizedValues.length;
          },
          message: 'Lawyer profile specializations must be unique.',
        },
      ],
    },
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      max: 70,
      validate: {
        validator: Number.isInteger,
        message: 'Years of experience must be a whole number.',
      },
    },
    consultationFee: {
      amount: {
        type: Number,
        required: true,
        min: 0,
        max: 1_000_000,
      },
      currency: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        match: /^[A-Z]{3}$/,
      },
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      default: 'UTC',
      match: /^(?:UTC|[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+)$/,
    },
    weeklyAvailability: {
      type: [availabilitySlotSchema],
      default: [],
      validate: {
        validator: isValidWeeklyAvailability,
        message:
          'Availability must contain valid, non-overlapping time slots with a maximum of 35 entries.',
      },
    },
    isVisible: {
      type: Boolean,
      default: false,
      required: true,
    },
    approvalStatus: {
      type: String,
      enum: LAWYER_APPROVAL_STATUS_VALUES,
      default: LAWYER_APPROVAL_STATUS.PENDING,
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 * Public lawyer discovery must require both approved and visible profiles.
 * The compound index supports that access pattern without exposing drafts.
 */
lawyerProfileSchema.index({ approvalStatus: 1, isVisible: 1 });
lawyerProfileSchema.index({ approvalStatus: 1, createdAt: 1, _id: 1 });
lawyerProfileSchema.index({
  specializations: 1,
  approvalStatus: 1,
  isVisible: 1,
});

export const LawyerProfile = model('LawyerProfile', lawyerProfileSchema);
