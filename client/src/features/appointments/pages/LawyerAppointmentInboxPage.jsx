import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import LawyerWorkspaceHeader from '../../auth/components/LawyerWorkspaceHeader.jsx';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  getPendingLawyerAppointments,
  submitAppointmentDecision,
} from '../api/lawyerAppointment.api.js';
import AppointmentRequestItem from '../components/AppointmentRequestItem.jsx';
import { APPOINTMENT_INBOX_PAGE_SIZE } from '../constants/appointmentDecision.js';

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: APPOINTMENT_INBOX_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const LawyerAppointmentInboxPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [activeReview, setActiveReview] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadAppointments = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getPendingLawyerAppointments({
          page,
          limit: APPOINTMENT_INBOX_PAGE_SIZE,
          signal: controller.signal,
        });
        const nextAppointments = response.data.appointments;
        const nextPagination = response.data.pagination;

        if (
          nextAppointments.length === 0
          && page > 1
          && nextPagination.totalPages < page
        ) {
          setPage(Math.max(1, nextPagination.totalPages));
          return;
        }

        setAppointments(nextAppointments);
        setPagination(nextPagination);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setAppointments([]);
        setPagination(EMPTY_PAGINATION);
        setLoadError(
          getAuthApiError(error, 'Appointment requests could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadAppointments();
    return () => controller.abort();
  }, [page, reloadKey]);

  const handleDecision = async () => {
    if (!activeReview) return;

    setFeedback('');
    setActiveReview((current) => ({ ...current, isSubmitting: true }));

    try {
      const response = await submitAppointmentDecision(activeReview);
      setFeedback(response.message);
      setActiveReview(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setLoadError(
        getAuthApiError(error, 'The appointment decision could not be saved.').message,
      );
      setActiveReview((current) => (
        current ? { ...current, isSubmitting: false } : null
      ));
    }
  };

  const refreshInbox = () => {
    setFeedback('');
    setActiveReview(null);
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-[#e8eeeb] text-ink">
      <LawyerWorkspaceHeader activePath="/lawyer/appointments" />

      <div className="client-page-enter mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
          to="/lawyer/account"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to account
        </Link>

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-forest">Consultation inbox</p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">Appointment requests</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Review pending client requests and their confidential consultation context.
            </p>
          </div>
          <button
            className="flex h-10 w-fit items-center gap-2 rounded-lg border border-white/90 bg-white/70 px-4 text-sm font-semibold shadow-sm backdrop-blur-lg hover:bg-white disabled:opacity-60"
            disabled={isLoading}
            onClick={refreshInbox}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {feedback ? (
          <div className="mb-6 flex items-start gap-3 border border-emerald-300 bg-emerald-50 p-4 text-emerald-900" role="status">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{feedback}</p>
          </div>
        ) : null}

        {loadError ? (
          <div className="mb-6 flex items-start gap-3 border border-red-300 bg-red-50 p-4 text-red-800" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p>{loadError}</p>
              <button className="mt-3 text-sm font-semibold underline" onClick={refreshInbox} type="button">
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-lg border border-white/90 bg-white/65 text-sm font-semibold shadow-lg shadow-ink/5 backdrop-blur-xl" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading appointment requests
          </div>
        ) : null}

        {!isLoading && !loadError && appointments.length === 0 ? (
          <section className="rounded-lg border border-white/90 bg-white/65 px-6 py-16 text-center shadow-lg shadow-ink/5 backdrop-blur-xl">
            <Inbox aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-forest" />
            <h2 className="text-xl font-bold">Inbox is clear</h2>
            <p className="mt-2 text-gray-600">There are no pending appointment requests.</p>
          </section>
        ) : null}

        {!isLoading && appointments.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
              <p>
                {pagination.totalItems} pending {pagination.totalItems === 1 ? 'request' : 'requests'}
              </p>
              <p>Page {pagination.page} of {pagination.totalPages}</p>
            </div>

            {appointments.map((appointment) => (
              <AppointmentRequestItem
                activeDecision={
                  activeReview?.appointmentId === appointment.id
                    ? activeReview.decision
                    : null
                }
                appointment={appointment}
                isSubmitting={Boolean(activeReview?.isSubmitting)}
                key={appointment.id}
                onCancelDecision={() => setActiveReview(null)}
                onConfirmDecision={handleDecision}
                onSelectDecision={(decision) => {
                  setLoadError('');
                  setFeedback('');
                  setActiveReview({
                    appointmentId: appointment.id,
                    decision,
                    isSubmitting: false,
                  });
                }}
              />
            ))}

            {pagination.totalPages > 1 ? (
              <nav className="flex items-center justify-end gap-2" aria-label="Appointment request pages">
                <button
                  aria-label="Previous page"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-white/90 bg-white/70 shadow-sm hover:bg-white disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  title="Previous page"
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  aria-label="Next page"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-white/90 bg-white/70 shadow-sm hover:bg-white disabled:opacity-40"
                  disabled={page >= pagination.totalPages}
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

export default LawyerAppointmentInboxPage;
