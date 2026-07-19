import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  CalendarClock,
  Check,
  LoaderCircle,
} from 'lucide-react';

import FieldError from '../../auth/components/FieldError.jsx';
import { getAuthApiError } from '../../auth/utils/apiError.js';
import { getPublicLawyerProfile } from '../../lawyers/api/publicLawyer.api.js';
import { rescheduleAppointment } from '../api/appointmentDashboard.api.js';
import {
  formatBookingDate,
  getSlotsForDate,
  getTodayDateInputValue,
} from '../utils/booking.js';

const RescheduleAppointmentForm = ({ appointment, onClose, onChanged }) => {
  const [profile, setProfile] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [fieldError, setFieldError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadAvailability = async () => {
      setIsLoading(true);
      setRequestError('');

      try {
        const response = await getPublicLawyerProfile({
          profileId: appointment.lawyerProfileId,
          signal: controller.signal,
        });
        setProfile(response.data.profile);
      } catch (error) {
        if (axios.isCancel(error)) return;

        setRequestError(
          getAuthApiError(
            error,
            'The lawyer availability could not be loaded.',
          ).message,
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadAvailability();
    return () => controller.abort();
  }, [appointment.lawyerProfileId]);

  const availableSlots = useMemo(
    () => getSlotsForDate(profile?.weeklyAvailability || [], appointmentDate),
    [appointmentDate, profile],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!appointmentDate) {
      setFieldError('Select a new appointment date.');
      return;
    }

    if (!selectedSlot) {
      setFieldError('Select one of the lawyer available time slots.');
      return;
    }

    setFieldError('');
    setRequestError('');
    setIsSubmitting(true);

    try {
      const response = await rescheduleAppointment({
        appointmentId: appointment.id,
        appointmentDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
      });
      onChanged(response.message);
    } catch (error) {
      const apiError = getAuthApiError(
        error,
        'The appointment could not be rescheduled.',
      );

      setFieldError(
        apiError.fieldErrors.appointmentDate
        || apiError.fieldErrors.startTime
        || apiError.fieldErrors.endTime
        || '',
      );
      setRequestError(apiError.message);
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="flex min-h-28 items-center justify-center gap-2 text-sm font-semibold"
      >
        <LoaderCircle
          aria-hidden="true"
          className="h-5 w-5 animate-spin text-forest"
        />
        Loading current availability
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center bg-emerald-50 text-forest">
          <CalendarClock aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-bold">Choose a new time</h3>
          <p className="mt-1 text-sm text-gray-600">
            The changed appointment will require lawyer approval again.
          </p>
        </div>
      </div>

      {requestError ? (
        <p
          className="mt-4 flex items-start gap-2 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          {requestError}
        </p>
      ) : null}

      {profile ? (
        <>
          <div className="mt-5">
            <label
              className="mb-2 block text-sm font-semibold"
              htmlFor={`reschedule-date-${appointment.id}`}
            >
              New appointment date
            </label>
            <input
              aria-invalid={Boolean(fieldError && !appointmentDate)}
              className="profile-control max-w-xs"
              disabled={isSubmitting}
              id={`reschedule-date-${appointment.id}`}
              min={getTodayDateInputValue()}
              onChange={(event) => {
                setAppointmentDate(event.target.value);
                setSelectedSlot(null);
                setFieldError('');
                setRequestError('');
              }}
              type="date"
              value={appointmentDate}
            />
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold">
              Available time in {profile.timezone}
            </legend>
            {!appointmentDate ? (
              <p className="mt-3 border border-dashed border-line bg-white px-4 py-4 text-sm text-gray-600">
                Select a date to view available times.
              </p>
            ) : availableSlots.length === 0 ? (
              <p className="mt-3 border border-dashed border-line bg-white px-4 py-4 text-sm text-gray-600">
                No recurring availability is listed for{' '}
                {formatBookingDate(appointmentDate)}.
              </p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availableSlots.map((slot) => {
                  const isSelected =
                    selectedSlot?.startTime === slot.startTime
                    && selectedSlot?.endTime === slot.endTime;

                  return (
                    <label
                      className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 border px-3 py-2 text-sm ${
                        isSelected
                          ? 'border-forest bg-emerald-50 text-forest'
                          : 'border-line bg-white hover:border-gray-400'
                      }`}
                      key={`${slot.startTime}-${slot.endTime}`}
                    >
                      <input
                        checked={isSelected}
                        className="sr-only"
                        disabled={isSubmitting}
                        name={`reschedule-slot-${appointment.id}`}
                        onChange={() => {
                          setSelectedSlot(slot);
                          setFieldError('');
                          setRequestError('');
                        }}
                        type="radio"
                      />
                      <span className="font-semibold">
                        {slot.startTime} - {slot.endTime}
                      </span>
                      {isSelected ? (
                        <Check aria-hidden="true" className="h-4 w-4" />
                      ) : null}
                    </label>
                  );
                })}
              </div>
            )}
            <FieldError
              id={`reschedule-error-${appointment.id}`}
              message={fieldError}
            />
          </fieldset>

          <div className="mt-5 flex flex-col justify-end gap-2 sm:flex-row">
            <button
              className="h-10 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100 disabled:opacity-60"
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
            >
              Keep current time
            </button>
            <button
              className="flex h-10 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin"
                />
              ) : (
                <CalendarClock aria-hidden="true" className="h-4 w-4" />
              )}
              {isSubmitting ? 'Rescheduling' : 'Request new time'}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-5 flex justify-end">
          <button
            className="h-10 border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
      )}
    </form>
  );
};

export default RescheduleAppointmentForm;
