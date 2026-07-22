import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Phone,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import FieldError from '../../auth/components/FieldError.jsx';
import ClientWorkspaceHeader from '../../auth/components/ClientWorkspaceHeader.jsx';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import { getPublicLawyerProfile } from '../../lawyers/api/publicLawyer.api.js';
import {
  formatConsultationFee,
  getLawyerInitials,
} from '../../lawyers/utils/publicLawyer.js';
import { createAppointment } from '../api/appointment.api.js';
import { CONSULTATION_TYPES } from '../constants/appointment.js';
import {
  formatBookingDate,
  getSlotsForDate,
  getTodayDateInputValue,
  validateBookingForm,
} from '../utils/booking.js';

const CONSULTATION_ICONS = Object.freeze({
  video: Video,
  phone: Phone,
  in_person: MapPin,
});

const AppointmentBookingPage = () => {
  const { profileId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('video');
  const [legalIssueSummary, setLegalIssueSummary] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getPublicLawyerProfile({
          profileId,
          signal: controller.signal,
        });
        setProfile(response.data.profile);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setLoadError(
          getAuthApiError(error, 'The lawyer profile could not be loaded.').message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadProfile();
    return () => controller.abort();
  }, [profileId]);

  const availableSlots = useMemo(
    () => getSlotsForDate(profile?.weeklyAvailability || [], appointmentDate),
    [appointmentDate, profile],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validateBookingForm({
      appointmentDate,
      selectedSlot,
      consultationType,
      legalIssueSummary,
    });

    setFieldErrors(errors);
    setSubmitError('');

    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);

    try {
      const response = await createAppointment({
        lawyerProfileId: profile.id,
        appointmentDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        consultationType,
        legalIssueSummary: legalIssueSummary.trim(),
      });
      setConfirmation(response.data.appointment);
    } catch (error) {
      const apiError = getAuthApiError(
        error,
        'The appointment request could not be submitted.',
      );
      setFieldErrors(apiError.fieldErrors);
      setSubmitError(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFieldError = (field) => {
    if (!fieldErrors[field]) return;

    setFieldErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  return (
    <main className="min-h-screen bg-[#e8eeeb] text-ink">
      <ClientWorkspaceHeader activePath="/lawyers" />

      <div className="client-page-enter mx-auto max-w-7xl px-5 py-7 sm:px-8 sm:py-10">
        <Link
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-forest hover:underline"
          to={`/lawyers/${profileId}`}
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to lawyer profile
        </Link>

        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center gap-2 rounded-lg border border-white/90 bg-white/65 text-sm font-semibold shadow-lg shadow-ink/5 backdrop-blur-xl" aria-busy="true" aria-live="polite">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Preparing secure booking
          </div>
        ) : null}

        {loadError ? (
          <div className="flex items-start gap-3 border border-red-300 bg-red-50 p-5 text-red-800" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{loadError}</p>
          </div>
        ) : null}

        {!isLoading && !loadError && profile && confirmation ? (
          <section className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-white/90 bg-white/65 shadow-panel backdrop-blur-xl" aria-labelledby="confirmation-heading">
            <div className="border-b border-white/80 bg-emerald-50/75 px-6 py-8 text-center sm:px-10">
              <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-forest" />
              <p className="mt-4 text-sm font-semibold uppercase text-forest">Request received</p>
              <h1 className="mt-2 font-display text-3xl font-semibold" id="confirmation-heading">
                Consultation pending approval
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-gray-600">
                {profile.lawyer.fullName} will review your appointment request.
              </p>
            </div>
            <dl className="grid gap-px bg-line sm:grid-cols-2">
              <div className="bg-white px-6 py-5">
                <dt className="text-sm font-semibold text-gray-500">Date</dt>
                <dd className="mt-1 font-bold">{formatBookingDate(appointmentDate)}</dd>
              </div>
              <div className="bg-white px-6 py-5">
                <dt className="text-sm font-semibold text-gray-500">Time</dt>
                <dd className="mt-1 font-bold">
                  {selectedSlot.startTime} - {selectedSlot.endTime}
                </dd>
              </div>
              <div className="bg-white px-6 py-5">
                <dt className="text-sm font-semibold text-gray-500">Timezone</dt>
                <dd className="mt-1 font-bold">{confirmation.timezone}</dd>
              </div>
              <div className="bg-white px-6 py-5">
                <dt className="text-sm font-semibold text-gray-500">Status</dt>
                <dd className="mt-1 font-bold capitalize">{confirmation.status}</dd>
              </div>
            </dl>
            <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:justify-end">
              <Link
                className="flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold hover:bg-gray-100"
                to="/lawyers"
              >
                Browse lawyers
              </Link>
              <Link
                className="flex h-11 items-center justify-center rounded-lg bg-forest px-5 text-sm font-semibold text-white hover:bg-forest-dark"
                to="/client/account"
              >
                Return to account
              </Link>
            </div>
          </section>
        ) : null}

        {!isLoading && !loadError && profile && !confirmation ? (
          <>
            <div className="mb-7 flex flex-col justify-between gap-5 border-b border-line pb-7 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-sm font-semibold uppercase text-forest">Consultation request</p>
                <h1 className="font-display text-3xl font-semibold sm:text-4xl">Choose a suitable time</h1>
                <p className="mt-2 max-w-2xl text-gray-600">
                  Times are shown in the lawyer timezone: {profile.timezone}.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-white/90 bg-white/65 px-4 py-3 shadow-sm backdrop-blur-lg">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-forest text-sm font-bold text-white shadow-md">
                  {getLawyerInitials(profile.lawyer.fullName)}
                </span>
                <div>
                  <p className="font-bold">{profile.lawyer.fullName}</p>
                  <p className="text-sm text-gray-600">{profile.professionalTitle}</p>
                </div>
              </div>
            </div>

            <form className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" noValidate onSubmit={handleSubmit}>
              <div className="space-y-6">
                <section className="booking-step-panel px-5 py-6 sm:px-7" aria-labelledby="schedule-heading">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center bg-emerald-50 text-forest">
                      <CalendarDays aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Step 1</p>
                      <h2 className="text-lg font-bold" id="schedule-heading">Date and time</h2>
                    </div>
                  </div>

                  <label className="mb-2 block text-sm font-semibold" htmlFor="appointment-date">
                    Appointment date
                  </label>
                  <input
                    aria-describedby={fieldErrors.appointmentDate ? 'appointment-date-error' : undefined}
                    aria-invalid={Boolean(fieldErrors.appointmentDate)}
                    className="profile-control max-w-sm"
                    id="appointment-date"
                    min={getTodayDateInputValue()}
                    onChange={(event) => {
                      setAppointmentDate(event.target.value);
                      setSelectedSlot(null);
                      clearFieldError('appointmentDate');
                      clearFieldError('selectedSlot');
                    }}
                    type="date"
                    value={appointmentDate}
                  />
                  <FieldError id="appointment-date-error" message={fieldErrors.appointmentDate} />

                  <fieldset className="mt-6">
                    <legend className="text-sm font-semibold">Available time</legend>
                    {!appointmentDate ? (
                      <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-gray-600">
                        Select a date to see the lawyer availability.
                      </p>
                    ) : availableSlots.length === 0 ? (
                      <p className="mt-3 border border-dashed border-line bg-paper px-4 py-5 text-sm text-gray-600">
                        This lawyer has no recurring availability on that day.
                      </p>
                    ) : (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {availableSlots.map((slot) => {
                          const isSelected =
                            selectedSlot?.startTime === slot.startTime
                            && selectedSlot?.endTime === slot.endTime;

                          return (
                            <label
                            className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                                isSelected
                                  ? 'border-forest bg-emerald-50 text-forest'
                                  : 'border-line bg-white hover:border-gray-400'
                              }`}
                              key={`${slot.startTime}-${slot.endTime}`}
                            >
                              <input
                                checked={isSelected}
                                className="sr-only"
                                name="appointment-slot"
                                onChange={() => {
                                  setSelectedSlot(slot);
                                  clearFieldError('selectedSlot');
                                }}
                                type="radio"
                              />
                              <span className="font-semibold">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              {isSelected ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
                            </label>
                          );
                        })}
                      </div>
                    )}
                    <FieldError id="appointment-slot-error" message={fieldErrors.selectedSlot} />
                  </fieldset>
                </section>

                <section className="booking-step-panel px-5 py-6 sm:px-7" aria-labelledby="format-heading">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center bg-emerald-50 text-forest">
                      <Video aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Step 2</p>
                      <h2 className="text-lg font-bold" id="format-heading">Consultation format</h2>
                    </div>
                  </div>
                  <fieldset>
                    <legend className="sr-only">Consultation type</legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {CONSULTATION_TYPES.map((type) => {
                        const Icon = CONSULTATION_ICONS[type.value];
                        const isSelected = consultationType === type.value;

                        return (
                          <label
                            className={`cursor-pointer rounded-lg border px-4 py-4 transition-colors ${
                              isSelected
                                ? 'border-forest bg-emerald-50'
                                : 'border-line bg-white hover:border-gray-400'
                            }`}
                            key={type.value}
                          >
                            <input
                              checked={isSelected}
                              className="sr-only"
                              name="consultation-type"
                              onChange={() => {
                                setConsultationType(type.value);
                                clearFieldError('consultationType');
                              }}
                              type="radio"
                            />
                            <Icon aria-hidden="true" className="mb-3 h-5 w-5 text-forest" />
                            <span className="block text-sm font-bold">{type.label}</span>
                            <span className="mt-1 block text-xs text-gray-600">{type.description}</span>
                          </label>
                        );
                      })}
                    </div>
                    <FieldError id="consultation-type-error" message={fieldErrors.consultationType} />
                  </fieldset>
                </section>

                <section className="booking-step-panel px-5 py-6 sm:px-7" aria-labelledby="summary-heading">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center bg-emerald-50 text-forest">
                      <LockKeyhole aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">Step 3</p>
                      <h2 className="text-lg font-bold" id="summary-heading">Confidential summary</h2>
                    </div>
                  </div>
                  <label className="mb-2 block text-sm font-semibold" htmlFor="legal-issue-summary">
                    Briefly describe the legal issue
                  </label>
                  <textarea
                    aria-describedby="summary-guidance legal-issue-summary-error"
                    aria-invalid={Boolean(fieldErrors.legalIssueSummary)}
                    className="profile-control min-h-36 resize-y"
                    id="legal-issue-summary"
                    maxLength={1000}
                    onChange={(event) => {
                      setLegalIssueSummary(event.target.value);
                      clearFieldError('legalIssueSummary');
                    }}
                    placeholder="Provide enough context for the lawyer to prepare for the consultation."
                    value={legalIssueSummary}
                  />
                  <div className="mt-2 flex items-start justify-between gap-4 text-xs text-gray-500">
                    <p id="summary-guidance">Do not include passwords, payment details, or unnecessary identity documents.</p>
                    <span className="shrink-0">{legalIssueSummary.length}/1000</span>
                  </div>
                  <FieldError id="legal-issue-summary-error" message={fieldErrors.legalIssueSummary} />
                </section>
              </div>

              <aside className="h-fit overflow-hidden rounded-lg border border-white/90 bg-white/65 shadow-lg shadow-ink/5 backdrop-blur-xl lg:sticky lg:top-24">
                <div className="border-b border-white/80 px-5 py-5">
                  <h2 className="text-lg font-bold">Request summary</h2>
                  <p className="mt-1 text-sm text-gray-600">Review before submitting</p>
                </div>
                <dl className="divide-y divide-line px-5">
                  <div className="py-4">
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <CalendarDays aria-hidden="true" className="h-4 w-4" />
                      Date
                    </dt>
                    <dd className="mt-2 font-semibold">
                      {appointmentDate ? formatBookingDate(appointmentDate) : 'Not selected'}
                    </dd>
                  </div>
                  <div className="py-4">
                    <dt className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Clock3 aria-hidden="true" className="h-4 w-4" />
                      Time
                    </dt>
                    <dd className="mt-2 font-semibold">
                      {selectedSlot
                        ? `${selectedSlot.startTime} - ${selectedSlot.endTime}`
                        : 'Not selected'}
                    </dd>
                    <dd className="mt-1 text-xs text-gray-500">{profile.timezone}</dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-xs font-semibold uppercase text-gray-500">Lawyer</dt>
                    <dd className="mt-2 font-semibold">{profile.lawyer.fullName}</dd>
                  </div>
                  <div className="py-4">
                    <dt className="text-xs font-semibold uppercase text-gray-500">Consultation fee</dt>
                    <dd className="mt-2 font-semibold">
                      {formatConsultationFee(profile.consultationFee)}
                    </dd>
                  </div>
                </dl>
                <div className="border-t border-line bg-gray-50 px-5 py-5">
                  {submitError ? (
                    <p className="mb-4 flex items-start gap-2 text-sm text-red-700" role="alert">
                      <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                      {submitError}
                    </p>
                  ) : null}
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-forest px-5 text-sm font-semibold text-white shadow-md hover:bg-forest-dark focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? (
                      <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShieldCheck aria-hidden="true" className="h-5 w-5" />
                    )}
                    {isSubmitting ? 'Submitting securely' : 'Submit request'}
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                    The lawyer must approve this request before it is confirmed.
                  </p>
                </div>
              </aside>
            </form>
          </>
        ) : null}
      </div>
    </main>
  );
};

export default AppointmentBookingPage;
