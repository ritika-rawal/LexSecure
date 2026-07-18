import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Mail,
  UserRound,
  X,
} from 'lucide-react';

import { REVIEW_DECISIONS } from '../constants/lawyerReview.js';
import {
  formatAvailabilityDay,
  formatConsultationFee,
  formatSubmittedDate,
} from '../utils/lawyerReview.js';

const LawyerReviewItem = ({
  activeDecision,
  isSubmitting,
  onCancelDecision,
  onConfirmDecision,
  onSelectDecision,
  profile,
}) => {
  const lawyerName = profile.lawyer?.fullName || 'Unknown lawyer';
  const lawyerEmail = profile.lawyer?.email || 'Email unavailable';

  return (
    <article className="border border-line bg-white" aria-labelledby={`profile-${profile.id}`}>
      <div className="border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-2 text-sm text-gray-600">
              <UserRound aria-hidden="true" className="h-4 w-4 shrink-0" />
              <span className="truncate">{lawyerEmail}</span>
            </p>
            <h2 className="text-xl font-bold" id={`profile-${profile.id}`}>
              {lawyerName}
            </h2>
            <p className="mt-1 text-forest">{profile.professionalTitle}</p>
          </div>
          <span className="w-fit border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
            Pending review
          </span>
        </div>
      </div>

      <div className="grid gap-7 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <h3 className="mb-2 text-sm font-bold uppercase text-gray-600">Professional summary</h3>
          <p className="whitespace-pre-wrap break-words leading-7 text-gray-700">
            {profile.biography}
          </p>

          <h3 className="mb-3 mt-6 text-sm font-bold uppercase text-gray-600">Specializations</h3>
          <ul className="flex flex-wrap gap-2" aria-label="Specializations">
            {profile.specializations.map((specialization) => (
              <li className="border border-line bg-paper px-3 py-1.5 text-sm" key={specialization}>
                {specialization}
              </li>
            ))}
          </ul>

          <h3 className="mb-3 mt-6 text-sm font-bold uppercase text-gray-600">
            Weekly availability
          </h3>
          {profile.weeklyAvailability.length > 0 ? (
            <ul className="grid gap-2 sm:grid-cols-2">
              {profile.weeklyAvailability.map((slot, index) => (
                <li
                  className="flex items-center justify-between gap-3 border-b border-line py-2 text-sm"
                  key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}-${index}`}
                >
                  <span className="font-semibold">{formatAvailabilityDay(slot.dayOfWeek)}</span>
                  <span className="text-gray-600">
                    {slot.startTime} - {slot.endTime}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No weekly availability submitted.</p>
          )}
        </div>

        <dl className="space-y-4 border-l-0 border-line lg:border-l lg:pl-6">
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" />
              Experience
            </dt>
            <dd className="mt-1">{profile.yearsOfExperience} years</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <BadgeCheck aria-hidden="true" className="h-4 w-4" />
              Consultation fee
            </dt>
            <dd className="mt-1">{formatConsultationFee(profile.consultationFee)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <Clock3 aria-hidden="true" className="h-4 w-4" />
              Timezone
            </dt>
            <dd className="mt-1 break-words">{profile.timezone}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <CalendarDays aria-hidden="true" className="h-4 w-4" />
              Submitted
            </dt>
            <dd className="mt-1">{formatSubmittedDate(profile.createdAt)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <Mail aria-hidden="true" className="h-4 w-4" />
              Account status
            </dt>
            <dd className="mt-1">{profile.lawyer?.isActive ? 'Active' : 'Disabled'}</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-line bg-gray-50 px-5 py-4 sm:px-6">
        {activeDecision ? (
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold">
              Confirm {activeDecision === REVIEW_DECISIONS.APPROVED ? 'approval' : 'rejection'} of{' '}
              {lawyerName}?
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
                  activeDecision === REVIEW_DECISIONS.APPROVED
                    ? 'bg-forest hover:bg-emerald-800'
                    : 'bg-red-700 hover:bg-red-800'
                }`}
                disabled={isSubmitting}
                onClick={onConfirmDecision}
                type="button"
              >
                {activeDecision === REVIEW_DECISIONS.APPROVED ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <X aria-hidden="true" className="h-4 w-4" />
                )}
                {isSubmitting ? 'Submitting' : 'Confirm decision'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-end gap-2 sm:flex-row">
            <button
              className="flex h-10 items-center justify-center gap-2 border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => onSelectDecision(REVIEW_DECISIONS.REJECTED)}
              type="button"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Reject
            </button>
            <button
              className="flex h-10 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={() => onSelectDecision(REVIEW_DECISIONS.APPROVED)}
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

export default LawyerReviewItem;
