import mongoose from 'mongoose';

import {
  REVIEW_COMMENT_LIMITS,
  REVIEW_RATING_LIMITS,
} from '../constants/review.js';

const { Schema, model } = mongoose;

const reviewSchema = new Schema(
  {
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
      immutable: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    lawyer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
    lawyerProfile: {
      type: Schema.Types.ObjectId,
      ref: 'LawyerProfile',
      required: true,
      immutable: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      immutable: true,
      min: REVIEW_RATING_LIMITS.MINIMUM,
      max: REVIEW_RATING_LIMITS.MAXIMUM,
      validate: {
        validator: Number.isInteger,
        message: 'Review rating must be a whole number.',
      },
    },
    comment: {
      type: String,
      default: null,
      immutable: true,
      trim: true,
      minlength: REVIEW_COMMENT_LIMITS.MINIMUM,
      maxlength: REVIEW_COMMENT_LIMITS.MAXIMUM,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  },
);

reviewSchema.index({ lawyerProfile: 1, createdAt: -1, _id: -1 });
reviewSchema.index({ lawyer: 1, createdAt: -1 });

export const Review = model('Review', reviewSchema);
