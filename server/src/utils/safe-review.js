export const buildSafeReviewResponse = (review) =>
  Object.freeze({
    id: review.id || review._id.toString(),
    appointmentId: review.appointment.toString(),
    rating: review.rating,
    comment: review.comment,
    reviewer: 'Verified client',
    createdAt: review.createdAt,
  });

export const buildSafePublicReviewResponse = (review) =>
  Object.freeze({
    id: review.id || review._id.toString(),
    rating: review.rating,
    comment: review.comment,
    reviewer: 'Verified client',
    createdAt: review.createdAt,
  });
