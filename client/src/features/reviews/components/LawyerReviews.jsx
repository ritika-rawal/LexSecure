import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MessageSquareText,
} from 'lucide-react';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import { getPublicLawyerReviews } from '../api/review.api.js';
import { REVIEW_PAGE_SIZE } from '../constants/review.js';
import { formatReviewDate } from '../utils/review.js';
import StarRating from './StarRating.jsx';

const EMPTY_SUMMARY = Object.freeze({
  averageRating: 0,
  totalReviews: 0,
});
const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: REVIEW_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const LawyerReviews = ({ profileId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadReviews = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getPublicLawyerReviews({
          profileId,
          page,
          limit: REVIEW_PAGE_SIZE,
          signal: controller.signal,
        });
        setReviews(response.data.reviews);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setReviews([]);
        setSummary(EMPTY_SUMMARY);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Reviews could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadReviews();
    return () => controller.abort();
  }, [page, profileId]);

  return (
    <section className="border-t border-white/80 bg-white/38 px-6 py-8 sm:px-8" aria-labelledby="reviews-heading">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-xl font-bold" id="reviews-heading">Client reviews</h2>
          {summary.totalReviews > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StarRating rating={Math.round(summary.averageRating)} />
              <span className="font-semibold">{summary.averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">
                {summary.totalReviews} {summary.totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          ) : null}
        </div>
        {pagination.totalPages > 1 ? (
          <nav className="flex items-center gap-2" aria-label="Review pages">
            <button
              aria-label="Previous review page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/90 bg-white/70 hover:bg-white disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              title="Previous page"
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              aria-label="Next review page"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/90 bg-white/70 hover:bg-white disabled:opacity-40"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              title="Next page"
              type="button"
            >
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </nav>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-6 flex min-h-24 items-center justify-center gap-2 text-sm font-semibold text-gray-600" aria-live="polite">
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-forest" />
          Loading reviews
        </div>
      ) : null}

      {loadError ? (
        <p className="mt-6 flex items-start gap-2 text-sm text-red-700" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          {loadError}
        </p>
      ) : null}

      {!isLoading && !loadError && reviews.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-white/45 px-5 py-10 text-center">
          <MessageSquareText aria-hidden="true" className="mx-auto h-7 w-7 text-gray-400" />
          <p className="mt-3 text-sm font-semibold">No verified reviews yet</p>
        </div>
      ) : null}

      {!isLoading && !loadError && reviews.length > 0 ? (
        <ul className="mt-6 divide-y divide-white/80 overflow-hidden rounded-lg border border-white/90 bg-white/45 px-5">
          {reviews.map((review) => (
            <li className="py-5" key={review.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{review.reviewer}</p>
                  <div className="mt-2">
                    <StarRating rating={review.rating} size="h-4 w-4" />
                  </div>
                </div>
                <time className="text-xs text-gray-500" dateTime={review.createdAt}>
                  {formatReviewDate(review.createdAt)}
                </time>
              </div>
              {review.comment ? (
                <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-gray-700">
                  {review.comment}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};

export default LawyerReviews;
