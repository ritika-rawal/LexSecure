import mongoose from 'mongoose';

import {
  IP_ACCESS_RULE_TYPE_VALUES,
} from '../constants/ip-access.js';

const { Schema, model } = mongoose;

const ipAccessRuleSchema = new Schema(
  {
    type: {
      type: String,
      enum: IP_ACCESS_RULE_TYPE_VALUES,
      required: true,
      index: true,
    },
    cidr: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      maxlength: 135,
    },
    address: {
      type: String,
      required: true,
      immutable: true,
      maxlength: 128,
      select: false,
    },
    prefixLength: {
      type: Number,
      required: true,
      immutable: true,
      min: 0,
      max: 128,
      select: false,
    },
    family: {
      type: Number,
      enum: [4, 6],
      required: true,
      immutable: true,
      select: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

ipAccessRuleSchema.index({ isActive: 1, type: 1 });

export const IpAccessRule = model('IpAccessRule', ipAccessRuleSchema);
