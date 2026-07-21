import mongoose from 'mongoose';

import { USER_ROLES, USER_ROLE_VALUES } from '../constants/user-roles.js';

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: USER_ROLES.CLIENT,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
      required: true,
    },
    mfaSecret: {
      type: String,
      maxlength: 512,
      select: false,
    },
    mfaRecoveryCodeHashes: {
      type: [{
        type: String,
        match: /^[a-f0-9]{64}$/,
      }],
      default: undefined,
      select: false,
      validate: {
        validator(values) {
          return !values || values.length <= 10;
        },
        message: 'MFA recovery-code collection exceeds its maximum size.',
      },
    },
    mfaLastUsedTimeStep: {
      type: Number,
      min: 0,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
    lockedUntil: {
      type: Date,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

/*
 * Sensitive authentication fields are excluded by default with select:false.
 * Controllers must explicitly opt in when they need password or MFA material.
 */
userSchema.set('toJSON', {
  transform(document, returnedObject) {
    delete returnedObject.passwordHash;
    delete returnedObject.mfaSecret;
    delete returnedObject.mfaRecoveryCodeHashes;
    delete returnedObject.mfaLastUsedTimeStep;
    delete returnedObject.failedLoginAttempts;
    delete returnedObject.lockedUntil;
    delete returnedObject.passwordChangedAt;
    return returnedObject;
  },
});

export const User = model('User', userSchema);
