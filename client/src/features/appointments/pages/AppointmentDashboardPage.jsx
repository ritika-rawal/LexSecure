import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import LogoutButton from '../../auth/components/LogoutButton.jsx';
import { USER_ROLES } from '../../auth/constants/userRoles.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import { getMyAppointments } from '../api/appointmentDashboard.api.js';
import DashboardAppointmentItem from '../components/DashboardAppointmentItem.jsx';
import {
  APPOINTMENT_DASHBOARD_PAGE_SIZE,
  APPOINTMENT_STATUS_FILTERS,
} from '../constants/appointmentDashboard.js';

const EMPTY_PAGINATION = Object.freeze({
  page: 1,
  limit: APPOINTMENT_DASHBOARD_PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
});

const AppointmentDashboardPage = () => {
  const { user } = useAuth();
  const isClient = user.role === USER_ROLES.CLIENT;
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadAppointments = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getMyAppointments({
          status,
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
  }, [page, reloadKey, status]);

  const refreshDashboard = () => {
    setReloadKey((current) => current + 1);
  };

  return (
    <main className="min-h-screen bg-[#f4f6f5] text-ink">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center bg-ink text-white">
              <Scale aria-hidden="true" className="h-5 w-5" />
            </span>
            <div>
              <span className="block text-lg font-bold leading-5">LexSecure</span>
              <span className="text-xs text-gray-500">
                {isClient ? 'Client workspace' : 'Lawyer workspace'}
              </span>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
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
            <h1 className="text-3xl font-bold sm:text-4xl">
              {isClient ? 'My appointments' : 'My schedule'}
            </h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Review appointment status, schedule details, and confidential context.
            </p>
          </div>
          <button
            className="flex h-10 w-fit items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
            disabled={isLoading}
            onClick={refreshDashboard}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="mb-7 overflow-x-auto border-y border-line bg-white" aria-label="Appointment status filter">
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
                }}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

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
          <div className="flex min-h-64 items-center justify-center gap-2 border border-line bg-white text-sm font-semibold" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Loading appointments
          </div>
        ) : null}

        {!isLoading && !loadError && appointments.length === 0 ? (
          <section className="border border-line bg-white px-6 py-16 text-center">
            <CalendarRange aria-hidden="true" className="mx-auto mb-4 h-10 w-10 text-forest" />
            <h2 className="text-xl font-bold">No appointments found</h2>
            <p className="mt-2 text-gray-600">
              There are no {status || 'recorded'} appointments in this view.
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
              <DashboardAppointmentItem appointment={appointment} key={appointment.id} />
            ))}

            {pagination.totalPages > 1 ? (
              <nav className="flex items-center justify-end gap-2" aria-label="Appointment dashboard pages">
                <button
                  aria-label="Previous page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  title="Previous page"
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <button
                  aria-label="Next page"
                  className="grid h-10 w-10 place-items-center border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-40"
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
