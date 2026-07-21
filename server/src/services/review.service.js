import mongoose from 'mongoose';

import { APPOINTMENT_STATUS } from '../constants/appointment.js';
import { Appointment } from '../models/Appointment.model.js';
import { Review } from '../models/Review.model.js';
import {
  buildSafePublicReviewResponse,
  buildSafeReviewResponse,
} from '../utils/safe-review.js';
import { getPublicLawyerProfile } from './public-lawyer-profile.service.js';

const { Types } = mongoose;
const REVIEWABLE_APPOINTMENT_STATUSES = Object.freeze([
  APPOINTMENT_STATUS.APPROVED,
  APPOINTMENT_STATUS.COMPLETED,
]);

const createAppointmentNotFoundError = () => {
  const error = new Error('Appointment not found.');
  error.statusCode = 404;
  return error;
};

const createReviewConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

const findClientAppointment = async ({ appointmentId, clientId }) => {
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    client: clientId,
  }).select('client lawyer lawyerProfile status endsAt');

  if (!appointment) {
    throw createAppointmentNotFoundError();
  }

  return appointment;
};

const isAppointmentReviewable = (appointment) =>
  REVIEWABLE_APPOINTMENT_STATUSES.includes(appointment.status)
  && appointment.endsAt.getTime() <= Date.now();

export const getClientAppointmentReview = async ({
  appointmentId,
  clientId,
}) => {
  const appointment = await findClientAppointment({ appointmentId, clientId });
  const review = await Review.findOne({
    appointment: appointment._id,
    client: clientId,
  });

  return {
    review: review ? buildSafeReviewResponse(review) : null,
    canReview: !review && isAppointmentReviewable(appointment),
  };
};

export const createAppointmentReview = async ({
  appointmentId,
  clientId,
  reviewData,
}) => {
  const appointment = await findClientAppointment({ appointmentId, clientId });

  if (!isAppointmentReviewable(appointment)) {
    throw createReviewConflictError(
      'Only completed approved consultations can be reviewed.',
    );
  }

  try {
    const review = await Review.create({
      appointment: appointment._id,
      client: clientId,
      lawyer: appointment.lawyer,
      lawyerProfile: appointment.lawyerProfile,
      rating: reviewData.rating,
      comment: reviewData.comment || null,
    });

    return buildSafeReviewResponse(review);
  } catch (error) {
    if (error.code === 11000) {
      throw createReviewConflictError(
        'A review already exists for this appointment.',
      );
    }

    throw error;
  }
};

export const listPublicLawyerReviews = async ({
  profileId,
  page,
  limit,
}) => {
  await getPublicLawyerProfile(profileId);

  const skip = (page - 1) * limit;
  const [result] = await Review.aggregate([
    { $match: { lawyerProfile: new Types.ObjectId(profileId) } },
    {
      $facet: {
        reviews: [
          { $sort: { createdAt: -1, _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              appointment: 1,
              rating: 1,
              comment: 1,
              createdAt: 1,
            },
          },
        ],
        summary: [
          {
            $group: {
              _id: null,
              averageRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);
  const totalItems = result?.summary?.[0]?.totalReviews || 0;
  const averageRating = result?.summary?.[0]?.averageRating || 0;

  return {
    reviews: (result?.reviews || []).map(buildSafePublicReviewResponse),
    summary: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalItems,
    },
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
};
