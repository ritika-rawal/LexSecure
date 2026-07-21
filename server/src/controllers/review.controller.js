import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
} from '../constants/audit.js';
import { REVIEW_LIST_LIMITS } from '../constants/review.js';
import { recordAuthenticatedAuditEvent } from '../services/audit.service.js';
import {
  createAppointmentReview as createAppointmentReviewService,
  getClientAppointmentReview as getClientAppointmentReviewService,
  listPublicLawyerReviews as listPublicLawyerReviewsService,
} from '../services/review.service.js';

const DEFAULT_PAGE = 1;

const disablePrivateResponseCaching = (res) => {
  res.set('Cache-Control', 'private, no-store');
};

export const getClientAppointmentReview = async (req, res) => {
  const result = await getClientAppointmentReviewService({
    appointmentId: req.params.appointmentId,
    clientId: req.user.id,
  });

  disablePrivateResponseCaching(res);
  res.status(200).json({
    status: 'success',
    data: result,
  });
};

export const createAppointmentReview = async (req, res) => {
  const review = await createAppointmentReviewService({
    appointmentId: req.params.appointmentId,
    clientId: req.user.id,
    reviewData: req.body,
  });

  await recordAuthenticatedAuditEvent(req, {
    action: AUDIT_ACTIONS.REVIEW_CREATED,
    targetType: AUDIT_TARGET_TYPES.REVIEW,
    targetId: review.id,
  });

  disablePrivateResponseCaching(res);
  res.status(201).json({
    status: 'success',
    message: 'Review submitted successfully.',
    data: {
      review,
    },
  });
};

export const listPublicLawyerReviews = async (req, res) => {
  const result = await listPublicLawyerReviewsService({
    profileId: req.params.profileId,
    page: req.query.page || DEFAULT_PAGE,
    limit: req.query.limit || REVIEW_LIST_LIMITS.DEFAULT,
  });

  res.status(200).json({
    status: 'success',
    data: result,
  });
};
