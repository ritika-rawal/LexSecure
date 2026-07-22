import {
  CalendarDays,
  Check,
  Clock3,
  LockKeyhole,
  Monitor,
  UserRound,
  X,
} from 'lucide-react';

import { APPOINTMENT_DECISIONS } from '../constants/appointmentDecision.js';
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatConsultationType,
  isExpiredAppointment,
} from '../utils/lawyerAppointment.js';

const AppointmentRequestItem = ({
  activeDecision,
  appointment,
  isSubmitting,
  onCancelDecision,
  onConfirmDecision,
  onSelectDecision,
}) => {
  const isExpired = isExpiredAppointment(appointment.startsAt);

  return (
    <article className="lawyer-request-card overflow-hidden rounded-lg border border-white/90 bg-white/65 shadow-lg shadow-ink/5 backdrop-blur-xl" aria-labelledby={`appointment-${appointment.id}`}>
      <div className="grid border-b border-line md:grid-cols-[210px_minmax(0,1fr)]">
        <div className="bg-ink px-5 py-5 text-white sm:px-6">
          <p className="text-xs font-semibold uppercase text-emerald-200">
            {isExpired ? 'Expired request' : 'Requested time'}
          </p>
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

        <div className="px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <UserRound aria-hidden="true" className="h-4 w-4" />
                Client
              </p>
              <h2 className="mt-1 text-xl font-bold" id={`appointment-${appointment.id}`}>
                {appointment.client.fullName}
              </h2>
            </div>
            <span className="w-fit rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
              Pending decision
            </span>
          </div>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="flex items-center gap-2 font-semibold text-gray-500">
                <Monitor aria-hidden="true" className="h-4 w-4" />
                Consultation
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
        </div>
      </div>

      <section className="px-5 py-6 sm:px-6" aria-labelledby={`summary-${appointment.id}`}>
        <div className="mb-3 flex items-center gap-2">
          <LockKeyhole aria-hidden="true" className="h-4 w-4 text-forest" />
          <h3 className="text-sm font-bold uppercase text-gray-600" id={`summary-${appointment.id}`}>
            Confidential consultation summary
          </h3>
        </div>
        <p className="whitespace-pre-wrap break-words leading-7 text-gray-700">
          {appointment.legalIssueSummary}
        </p>
      </section>

      <div className="border-t border-line bg-gray-50 px-5 py-4 sm:px-6">
        {activeDecision ? (
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold">
              Confirm {activeDecision === APPOINTMENT_DECISIONS.APPROVED ? 'approval' : 'rejection'} of this request?
            </p>
            <div className="flex gap-2">
              <button
                className="h-10 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
                disabled={isSubmitting}
                onClick={onCancelDecision}
                type="button"
              >
                Cancel
              </button>
              <button
                className={`flex h-10 items-center gap-2 px-4 text-sm font-semibold text-white disabled:opacity-60 ${
                  activeDecision === APPOINTMENT_DECISIONS.APPROVED
                    ? 'bg-forest hover:bg-forest-dark'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
                disabled={isSubmitting}
                onClick={onConfirmDecision}
                type="button"
              >
                {activeDecision === APPOINTMENT_DECISIONS.APPROVED ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <X aria-hidden="true" className="h-4 w-4" />
                )}
                {isSubmitting ? 'Saving decision' : 'Confirm decision'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              className="flex h-10 items-center justify-center gap-2 border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => onSelectDecision(APPOINTMENT_DECISIONS.REJECTED)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Reject
            </button>
            <button
              className="flex h-10 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:cursor-not-allowed disabled:opacity-40"
              disabled={isSubmitting || isExpired}
              onClick={() => onSelectDecision(APPOINTMENT_DECISIONS.APPROVED)}
              title={isExpired ? 'Past appointments cannot be approved' : undefined}
              type="button"
            >
              <Check aria-hidden="true" className="h-4 w-4" />
              Approve
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default AppointmentRequestItem;
