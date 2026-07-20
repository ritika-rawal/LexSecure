import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ScrollText,
  LoaderCircle,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import LogoutButton from '../../auth/components/LogoutButton.jsx';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  getPendingLawyerProfiles,
  submitLawyerProfileReview,
} from '../api/lawyerReview.api.js';
import LawyerReviewItem from '../components/LawyerReviewItem.jsx';
import { REVIEW_PAGE_SIZE } from '../constants/lawyerReview.js';

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: REVIEW_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const LawyerReviewPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeReview, setActiveReview] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadQueue = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getPendingLawyerProfiles({
          page,
          limit: REVIEW_PAGE_SIZE,
          signal: controller.signal,
        });
        const nextProfiles = response.data.profiles;
        const nextPagination = response.data.pagination;

        if (nextProfiles.length === 0 && page > 1 && nextPagination.totalPages < page) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }

        setProfiles(nextProfiles);
        setPagination(nextPagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setProfiles([]);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Pending lawyer profiles could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadQueue();
    return () => controller.abort();
  }, [page, reloadKey]);

  const handleReview = async () => {
    if (!activeReview) return;

    setFeedback('');
    setActiveReview((current) => ({ ...current, isSubmitting: true }));

    try {
      const response = await submitLawyerProfileReview(activeReview);
      setFeedback(response.message);
      setActiveReview(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setFeedback('');
      setLoadError(getAuthApiError(error, 'The review decision could not be saved.').message);
      setActiveReview((current) => (
        current ? { ...current, isSubmitting: false } : null
      ));
    }
  };

  const refreshQueue = () => {
    setFeedback('');
    setActiveReview(null);
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-ink text-white">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-lg font-bold leading-5">LexSecure</span>
              <span className="text-xs text-gray-600">Administration</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="flex h-10 items-center gap-2 border border-gray-300 bg-white px-3 text-sm font-semibold hover:bg-gray-100"
              to="/admin/audit-logs"
            >
              <ScrollText aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Audit logs</span>
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-forest">Profile verification</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Lawyer review queue</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Review professional information before making a lawyer profile publicly visible.
            </p>
          </div>
          <button
            className="flex h-10 w-fit items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:opacity-60"
            disabled={isLoading}
            onClick={refreshQueue}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {feedback ? (
          <div className="mb-6 flex items-start gap-3 border border-emerald-300 bg-emerald-50 p-4 text-emerald-900" role="status">
            <ClipboardCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{feedback}</p>
          </div>
        ) : null}

        {loadError ? (
          <div className="mb-6 flex items-start gap-3 border border-red-300 bg-red-50 p-4 text-red-800" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p>{loadError}</p>
              <button
                className="mt-3 text-sm font-semibold underline"
                onClick={refreshQueue}
                type="button"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading pending profiles
          </div>
        ) : null}

        {!isLoading && !loadError && profiles.length === 0 ? (
          <section className="border border-line bg-white px-6 py-16 text-center">
            <ClipboardCheck aria-hidden="true" className="mx-auto mb-4 h-9 w-9 text-forest" />
            <h2 className="text-xl font-bold">Review queue is clear</h2>
            <p className="mt-2 text-gray-600">There are no pending lawyer profiles.</p>
          </section>
        ) : null}

        {!isLoading && profiles.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
              <p>
                {pagination.totalItems} pending {pagination.totalItems === 1 ? 'profile' : 'profiles'}
              </p>
              <p>
                Page {pagination.page} of {pagination.totalPages}
              </p>
            </div>

            {profiles.map((profile) => (
              <LawyerReviewItem
                activeDecision={
                  activeReview?.profileId === profile.id ? activeReview.decision : null
                }
                isSubmitting={
                  Boolean(activeReview?.isSubmitting)
                }
                key={profile.id}
                onCancelDecision={() => setActiveReview(null)}
                onConfirmDecision={handleReview}
                onSelectDecision={(decision) => {
                  setLoadError('');
                  setFeedback('');
                  setActiveReview({
                    profileId: profile.id,
                    decision,
                    isSubmitting: false,
                  });
                }}
                profile={profile}
              />
            ))}

            {pagination.totalPages > 1 ? (
              <nav className="flex items-center justify-end gap-2 pt-2" aria-label="Review queue pages">
                <button
                  aria-label="Previous page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  title="Previous page"
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  aria-label="Next page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page >= pagination.totalPages || isLoading}
                  onClick={() => setPage((current) => current + 1)}
                  title="Next page"
                  type="button"
                >
                  <ChevronRight aria-hidden="true" className="h-5 w-5" />
                </button>
              </nav>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
};

export default LawyerReviewPage;
