import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
} from 'lucide-react';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  createAppointmentReview,
  getAppointmentReview,
} from '../api/review.api.js';
import { REVIEW_COMMENT_MAXIMUM_LENGTH } from '../constants/review.js';
import { formatReviewDate, validateReview } from '../utils/review.js';
import StarRating from './StarRating.jsx';

const AppointmentReview = ({ appointmentId, lawyerName }) => {
  const [review, setReview] = useState(null);
  const [canReview, setCanReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadReview = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await getAppointmentReview({
          appointmentId,
          signal: controller.signal,
        });
        setReview(response.data.review);
        setCanReview(response.data.canReview);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setErrorMessage(
          getAuthApiError(error, 'Review status could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadReview();
    return () => controller.abort();
  }, [appointmentId]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateReview({ rating, comment });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await createAppointmentReview({
        appointmentId,
        rating,
        comment: comment.trim(),
      });
      setReview(response.data.review);
      setCanReview(false);
    } catch (error) {
      setErrorMessage(
        getAuthApiError(error, 'Review could not be submitted.').message,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="border-t border-line bg-[#f8faf9] px-5 py-5 sm:px-6">
      <div className="flex items-center gap-2">
        <MessageSquareText aria-hidden="true" className="h-4 w-4 text-forest" />
        <h3 className="text-sm font-bold">Consultation review</h3>
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-600" aria-live="polite">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-forest" />
          Loading review status
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-red-700" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {errorMessage}
        </p>
      ) : null}

      {!isLoading && review ? (
        <div className="mt-4 border border-line bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StarRating rating={review.rating} />
            <span className="text-xs text-gray-500">
              {formatReviewDate(review.createdAt)}
            </span>
          </div>
          {review.comment ? (
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
              {review.comment}
            </p>
          ) : null}
          <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Review submitted
          </p>
        </div>
      ) : null}

      {!isLoading && !review && canReview ? (
        <form className="mt-4" onSubmit={handleSubmit}>
          <p className="text-sm text-gray-600">Rate your consultation with {lawyerName}.</p>
          <div className="mt-2">
            <StarRating
              interactive
              onChange={(value) => {
                setRating(value);
                if (errorMessage) setErrorMessage('');
              }}
              rating={rating}
              size="h-6 w-6"
            />
          </div>
          <label className="mt-4 block text-sm font-semibold" htmlFor={`review-comment-${appointmentId}`}>
            Comment <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            aria-invalid={Boolean(errorMessage)}
            className="profile-control mt-2 min-h-24 resize-y"
            disabled={isSubmitting}
            id={`review-comment-${appointmentId}`}
            maxLength={REVIEW_COMMENT_MAXIMUM_LENGTH}
            onChange={(event) => {
              setComment(event.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Share your consultation experience."
            value={comment}
          />
          <div className="mt-2 flex items-center justify-between gap-4 text-xs text-gray-500">
            <span>Published without your account name.</span>
            <span>{comment.length}/{REVIEW_COMMENT_MAXIMUM_LENGTH}</span>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="flex h-10 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
              disabled={isSubmitting || rating === 0}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
              )}
              {isSubmitting ? 'Submitting' : 'Submit review'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
};

export default AppointmentReview;
