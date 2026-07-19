import { useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock3,
  LockKeyhole,
  Monitor,
  UserRound,
} from 'lucide-react';

import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatConsultationType,
} from '../utils/lawyerAppointment.js';

const STATUS_STYLES = Object.freeze({
  pending: 'border-amber-300 bg-amber-50 text-amber-800',
  approved: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-300 bg-red-50 text-red-800',
  cancelled: 'border-gray-300 bg-gray-100 text-gray-700',
  completed: 'border-cyan-300 bg-cyan-50 text-cyan-900',
});

const DashboardAppointmentItem = ({ appointment }) => {
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const participantLabel =
    appointment.participant.role === 'lawyer' ? 'Lawyer' : 'Client';

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
        </div>
      </div>
    </article>
  );
};

export default DashboardAppointmentItem;
