import { useState } from 'react';
import {
  CalendarDays,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock3,
  LockKeyhole,
  LoaderCircle,
  Monitor,
  UserRound,
  X,
} from 'lucide-react';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import { cancelAppointment } from '../api/appointmentDashboard.api.js';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatConsultationType,
  isExpiredAppointment,
} from '../utils/lawyerAppointment.js';

const STATUS_STYLES = Object.freeze({
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-800',
  cancelled: 'border-gray-300 bg-gray-100 text-gray-700',
  completed: 'border-cyan-300 bg-cyan-50 text-cyan-900',
});

const DashboardAppointmentItem = ({ appointment, onChanged }) => {
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isCancellationOpen, setIsCancellationOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationError, setCancellationError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const participantLabel =
    appointment.participant.role === 'lawyer' ? 'Lawyer' : 'Client';
  const viewerIsClient = appointment.participant.role === 'lawyer';
  const canCancel =
    !isExpiredAppointment(appointment.startsAt)
    && (
      (viewerIsClient && ['pending', 'approved'].includes(appointment.status))
      || (!viewerIsClient && appointment.status === 'approved')
    );

  const handleCancellation = async () => {
    const normalizedReason = cancellationReason.trim();

    if (normalizedReason.length < 10 || normalizedReason.length > 500) {
      setCancellationError('Reason must be between 10 and 500 characters.');
      return;
    }

    setCancellationError('');
    setIsCancelling(true);

    try {
      const response = await cancelAppointment({
        appointmentId: appointment.id,
        reason: normalizedReason,
      });
      onChanged(response.message);
    } catch (error) {
      setCancellationError(
        getAuthApiError(error, 'The appointment could not be cancelled.').message,
      );
      setIsCancelling(false);
    }
  };

  return (
    <article className="border border-line bg-white" aria-labelledby={`dashboard-appointment-${appointment.id}`}>
      <div className="grid md:grid-cols-[220px_minmax(0,1fr)]">
        <div className="border-b border-line bg-ink px-5 py-5 text-white md:border-b-0 md:border-r">
          <p className="text-xs font-semibold uppercase text-emerald-200">Consultation</p>
          <p className="mt-3 text-lg font-bold leading-7">
            {formatAppointmentDate(appointment.startsAt, appointment.timezone)}
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-gray-200">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
            {formatAppointmentTime(appointment.startsAt, appointment.timezone)}
            {' - '}
            {formatAppointmentTime(appointment.endsAt, appointment.timezone)}
          </p>
          <p className="mt-1 text-xs text-gray-400">{appointment.timezone}</p>
        </div>

        <div>
          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="flex items-center gap-2 text-sm text-gray-500">
                  <UserRound aria-hidden="true" className="h-4 w-4" />
                  {participantLabel}
                </p>
                <h2 className="mt-1 text-xl font-bold" id={`dashboard-appointment-${appointment.id}`}>
                  {appointment.participant.fullName}
                </h2>
              </div>
              <span className={`w-fit border px-3 py-1.5 text-sm font-semibold capitalize ${STATUS_STYLES[appointment.status] || STATUS_STYLES.cancelled}`}>
                {appointment.status}
              </span>
            </div>

            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <div>
                <dt className="flex items-center gap-2 font-semibold text-gray-500">
                  <Monitor aria-hidden="true" className="h-4 w-4" />
                  Format
                </dt>
                <dd className="mt-1">{formatConsultationType(appointment.consultationType)}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-2 font-semibold text-gray-500">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  Requested
                </dt>
                <dd className="mt-1">
                  {formatAppointmentDate(appointment.createdAt, appointment.timezone)}
                </dd>
              </div>
            </dl>

            {appointment.cancellation ? (
              <div className="mt-5 border-l-4 border-gray-400 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">
                  Cancelled by {appointment.cancellation.cancelledByRole}
                </p>
                <p className="mt-1 break-words text-sm text-gray-700">
                  {appointment.cancellation.reason}
                </p>
              </div>
            ) : null}
          </div>

          <div className="border-t border-line bg-gray-50">
            <button
              aria-expanded={isSummaryVisible}
              className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left text-sm font-semibold hover:bg-gray-100 sm:px-6"
              onClick={() => setIsSummaryVisible((current) => !current)}
              type="button"
            >
              <span className="flex items-center gap-2">
                <LockKeyhole aria-hidden="true" className="h-4 w-4 text-forest" />
                Confidential consultation summary
              </span>
              {isSummaryVisible ? (
                <ChevronUp aria-hidden="true" className="h-4 w-4" />
              ) : (
                <ChevronDown aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
            {isSummaryVisible ? (
              <p className="border-t border-line px-5 py-4 whitespace-pre-wrap break-words leading-7 text-gray-700 sm:px-6">
                {appointment.legalIssueSummary}
              </p>
            ) : null}
          </div>

          {canCancel ? (
            <div className="border-t border-line px-5 py-4 sm:px-6">
              {isCancellationOpen ? (
                <div>
                  <label className="block text-sm font-semibold" htmlFor={`cancel-reason-${appointment.id}`}>
                    Cancellation reason
                  </label>
                  <textarea
                    aria-invalid={Boolean(cancellationError)}
                    className="profile-control mt-2 min-h-24 resize-y"
                    disabled={isCancelling}
                    id={`cancel-reason-${appointment.id}`}
                    maxLength={500}
                    onChange={(event) => {
                      setCancellationReason(event.target.value);
                      if (cancellationError) setCancellationError('');
                    }}
                    placeholder="Explain why this consultation must be cancelled."
                    value={cancellationReason}
                  />
                  <div className="mt-2 flex items-center justify-between gap-4 text-xs text-gray-500">
                    <span>Both appointment participants will see this reason.</span>
                    <span>{cancellationReason.length}/500</span>
                  </div>
                  {cancellationError ? (
                    <p className="mt-2 flex items-start gap-2 text-sm text-red-700" role="alert">
                      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                      {cancellationError}
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-col justify-end gap-2 sm:flex-row">
                    <button
                      className="h-10 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
                      disabled={isCancelling}
                      onClick={() => {
                        setIsCancellationOpen(false);
                        setCancellationReason('');
                        setCancellationError('');
                      }}
                      type="button"
                    >
                      Keep appointment
                    </button>
                    <button
                      className="flex h-10 items-center justify-center gap-2 bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                      disabled={isCancelling}
                      onClick={handleCancellation}
                      type="button"
                    >
                      {isCancelling ? (
                        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <X aria-hidden="true" className="h-4 w-4" />
                      )}
                      {isCancelling ? 'Cancelling' : 'Confirm cancellation'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    className="flex h-10 items-center gap-2 border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
                    onClick={() => setIsCancellationOpen(true)}
                    type="button"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    Cancel appointment
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default DashboardAppointmentItem;
