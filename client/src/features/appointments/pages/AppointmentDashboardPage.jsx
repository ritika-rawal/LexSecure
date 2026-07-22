import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { USER_ROLES } from '../../auth/constants/userRoles.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import ClientWorkspaceHeader from '../../auth/components/ClientWorkspaceHeader.jsx';
import LawyerWorkspaceHeader from '../../auth/components/LawyerWorkspaceHeader.jsx';
import { getMyAppointments } from '../api/appointmentDashboard.api.js';
import AppointmentHistoryFilters from '../components/AppointmentHistoryFilters.jsx';
import DashboardAppointmentItem from '../components/DashboardAppointmentItem.jsx';
import {
  APPOINTMENT_DASHBOARD_PAGE_SIZE,
  APPOINTMENT_STATUS_FILTERS,
  APPOINTMENT_VIEW_FILTERS,
} from '../constants/appointmentDashboard.js';

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: APPOINTMENT_DASHBOARD_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});
const EMPTY_FILTERS = Object.freeze({
  search: '',
  fromDate: '',
  toDate: '',
});

const AppointmentDashboardPage = () => {
  const { user } = useAuth();
  const isClient = user.role === USER_ROLES.CLIENT;
  const [view, setView] = useState('upcoming');
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadAppointments = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getMyAppointments({
          view,
          status,
          search: filters.search,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          page,
          limit: APPOINTMENT_DASHBOARD_PAGE_SIZE,
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
          getAuthApiError(error, 'Appointments could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadAppointments();
    return () => controller.abort();
  }, [filters, page, reloadKey, status, view]);

  const refreshDashboard = () => {
    setFeedback('');
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-[#e8eeeb] text-ink">
      {isClient ? (
        <ClientWorkspaceHeader activePath="/client/appointments" />
      ) : (
        <LawyerWorkspaceHeader activePath="/lawyer/schedule" />
      )}

      <div className="client-page-enter mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <Link
          className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
          to={isClient ? '/client/account' : '/lawyer/account'}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to account
        </Link>

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase text-forest">
              {isClient ? 'Consultation tracking' : 'Consultation schedule'}
            </p>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              {isClient ? 'My appointments' : 'My schedule'}
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Review appointment status, schedule details, and confidential context.
            </p>
          </div>
          <button
            className="flex h-10 w-fit items-center gap-2 rounded-lg border border-white/90 bg-white/70 px-4 text-sm font-semibold shadow-sm backdrop-blur-lg hover:bg-white disabled:opacity-60"
            disabled={isLoading}
            onClick={refreshDashboard}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mb-7 overflow-x-auto rounded-lg border border-white/90 bg-white/60 shadow-lg shadow-ink/5 backdrop-blur-xl" aria-label="Appointment status filter">
          <div className="flex min-w-max border-b border-white/80 px-2">
            {APPOINTMENT_VIEW_FILTERS.map((filter) => (
              <button
                aria-pressed={view === filter.value}
                className={`h-12 px-4 text-sm font-semibold transition-colors ${
                  view === filter.value
                    ? 'bg-ink text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-ink'
                }`}
                key={filter.value}
                onClick={() => {
                  setView(filter.value);
                  setPage(1);
                  setFeedback('');
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="flex min-w-max px-2">
            {APPOINTMENT_STATUS_FILTERS.map((filter) => (
              <button
                aria-pressed={status === filter.value}
                className={`h-12 border-b-2 px-4 text-sm font-semibold transition-colors ${
                  status === filter.value
                    ? 'border-forest text-forest'
                    : 'border-transparent text-gray-600 hover:text-ink'
                }`}
                key={filter.value || 'all'}
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                  setFeedback('');
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <AppointmentHistoryFilters
          filters={filters}
          isLoading={isLoading}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setPage(1);
            setFeedback('');
          }}
          participantLabel={isClient ? 'Lawyer' : 'Client'}
        />

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
              <button className="mt-3 text-sm font-semibold underline" onClick={refreshDashboard} type="button">
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 rounded-lg border border-white/90 bg-white/65 text-sm font-semibold shadow-lg shadow-ink/5 backdrop-blur-xl" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading appointments
          </div>
        ) : null}

        {!isLoading && !loadError && appointments.length === 0 ? (
          <section className="rounded-lg border border-white/90 bg-white/65 px-6 py-16 text-center shadow-lg shadow-ink/5 backdrop-blur-xl">
            <CalendarRange aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-forest" />
            <h2 className="text-xl font-bold">No appointments found</h2>
            <p className="mt-2 text-gray-600">
              No appointments match the selected view and filters.
            </p>
          </section>
        ) : null}

        {!isLoading && !loadError && appointments.length > 0 ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
              <p>{pagination.totalItems} {pagination.totalItems === 1 ? 'appointment' : 'appointments'}</p>
              <p>Page {pagination.page} of {pagination.totalPages}</p>
            </div>

            {appointments.map((appointment) => (
              <DashboardAppointmentItem
                appointment={appointment}
                key={appointment.id}
                onChanged={(message) => {
                  setFeedback(message);
                  setReloadKey((current) => current + 1);
                }}
              />
            ))}

            {pagination.totalPages > 1 ? (
              <nav className="flex items-center justify-end gap-2" aria-label="Appointment dashboard pages">
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

export default AppointmentDashboardPage;
