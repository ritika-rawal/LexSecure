import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

import { getAuthApiError } from '../../auth/utils/apiError.js';
import {
  createLawyerProfile,
  updateCurrentLawyerProfile,
} from '../api/lawyerProfile.api.js';
import { WEEK_DAYS } from '../constants/profile.js';
import {
  createAvailabilityRow,
  createEmptyProfileForm,
  profileFormToPayload,
  profileToForm,
} from '../utils/profileForm.js';
import { validateLawyerProfile } from '../validation/lawyerProfile.validation.js';

const FieldError = ({ message }) =>
  message ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
      <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      {message}
    </p>
  ) : null;

const formatDay = (day) => day.charAt(0).toUpperCase() + day.slice(1);

const LawyerProfileForm = ({ initialProfile, onSaved }) => {
  const [values, setValues] = useState(() =>
    initialProfile ? profileToForm(initialProfile) : createEmptyProfileForm(),
  );
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
    setSuccessMessage('');
  };

  const updateSpecialization = (index, value) => {
    setValues((current) => ({
      ...current,
      specializations: current.specializations.map((item, itemIndex) =>
        itemIndex === index ? value : item,
      ),
    }));
    setErrors((current) => ({ ...current, specializations: undefined }));
  };

  const addSpecialization = () => {
    if (values.specializations.length >= 10) return;
    setValues((current) => ({
      ...current,
      specializations: [...current.specializations, ''],
    }));
  };

  const removeSpecialization = (index) => {
    if (values.specializations.length === 1) return;
    setValues((current) => ({
      ...current,
      specializations: current.specializations.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const addAvailability = () => {
    if (values.weeklyAvailability.length >= 35) return;
    setValues((current) => ({
      ...current,
      weeklyAvailability: [...current.weeklyAvailability, createAvailabilityRow()],
    }));
    setErrors((current) => ({ ...current, weeklyAvailability: undefined }));
  };

  const updateAvailability = (rowId, field, value) => {
    setValues((current) => ({
      ...current,
      weeklyAvailability: current.weeklyAvailability.map((slot) =>
        slot.rowId === rowId ? { ...slot, [field]: value } : slot,
      ),
    }));
    setErrors((current) => ({ ...current, weeklyAvailability: undefined }));
  };

  const removeAvailability = (rowId) => {
    setValues((current) => ({
      ...current,
      weeklyAvailability: current.weeklyAvailability.filter((slot) => slot.rowId !== rowId),
    }));
    setErrors((current) => ({ ...current, weeklyAvailability: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateLawyerProfile(values);
    setErrors(validationErrors);
    setSubmitError('');
    setSuccessMessage('');

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const payload = profileFormToPayload(values);
      const response = initialProfile
        ? await updateCurrentLawyerProfile(payload)
        : await createLawyerProfile(payload);
      const savedProfile = response.data.profile;

      setValues(profileToForm(savedProfile));
      setSuccessMessage(
        initialProfile ? 'Profile updated successfully.' : 'Profile created successfully.',
      );
      onSaved(savedProfile);
    } catch (error) {
      const apiError = getAuthApiError(error, 'Lawyer profile could not be saved.');
      setSubmitError(apiError.message);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="lawyer-profile-form space-y-6" noValidate onSubmit={handleSubmit}>
      {submitError ? (
        <div className="border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <div className="flex gap-2">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          <div className="flex gap-2">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{successMessage}</p>
          </div>
        </div>
      ) : null}

      <section className="border-t border-line bg-white" aria-labelledby="professional-heading">
        <div className="border-b border-line px-5 py-5 sm:px-7">
          <h2 id="professional-heading" className="text-lg font-bold">Professional details</h2>
        </div>
        <div className="grid gap-5 px-5 py-6 sm:px-7">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="professionalTitle">
              Professional title
            </label>
            <input
              className="profile-control"
              id="professionalTitle"
              maxLength={120}
              name="professionalTitle"
              onChange={updateField}
              placeholder="Solicitor and Legal Consultant"
              value={values.professionalTitle}
              aria-invalid={Boolean(errors.professionalTitle)}
            />
            <FieldError message={errors.professionalTitle} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="biography">
              Biography
            </label>
            <textarea
              className="profile-control min-h-36 resize-y"
              id="biography"
              maxLength={2000}
              name="biography"
              onChange={updateField}
              placeholder="Describe your professional background and approach to client consultations."
              value={values.biography}
              aria-invalid={Boolean(errors.biography)}
            />
            <div className="mt-1 flex justify-between gap-4 text-xs text-gray-500">
              <FieldError message={errors.biography} />
              <span className="ml-auto">{values.biography.length}/2000</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold" htmlFor="specialization-0">
                Specializations
              </label>
              <button
                className="inline-flex h-9 items-center gap-1.5 border border-line px-3 text-sm font-semibold text-forest hover:bg-emerald-50 disabled:opacity-50"
                disabled={values.specializations.length >= 10}
                onClick={addSpecialization}
                type="button"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {values.specializations.map((specialization, index) => (
                <div className="grid grid-cols-[minmax(0,1fr)_40px] gap-2" key={`specialization-${index}`}>
                  <input
                    className="profile-control"
                    id={`specialization-${index}`}
                    maxLength={80}
                    onChange={(event) => updateSpecialization(index, event.target.value)}
                    placeholder="Family Law"
                    value={specialization}
                  />
                  <button
                    aria-label={`Remove specialization ${index + 1}`}
                    className="grid h-12 w-10 place-items-center border border-line text-gray-600 hover:border-red-400 hover:text-red-700 disabled:opacity-40"
                    disabled={values.specializations.length === 1}
                    onClick={() => removeSpecialization(index)}
                    title="Remove specialization"
                    type="button"
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <FieldError message={errors.specializations} />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white" aria-labelledby="practice-heading">
        <div className="border-b border-line px-5 py-5 sm:px-7">
          <h2 id="practice-heading" className="text-lg font-bold">Practice settings</h2>
        </div>
        <div className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-7">
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="yearsOfExperience">
              Years of experience
            </label>
            <input
              className="profile-control"
              id="yearsOfExperience"
              max={70}
              min={0}
              name="yearsOfExperience"
              onChange={updateField}
              type="number"
              value={values.yearsOfExperience}
              aria-invalid={Boolean(errors.yearsOfExperience)}
            />
            <FieldError message={errors.yearsOfExperience} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="consultationFeeAmount">
              Consultation fee
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-2">
              <input
                className="profile-control"
                id="consultationFeeAmount"
                min={0}
                name="consultationFeeAmount"
                onChange={updateField}
                step="0.01"
                type="number"
                value={values.consultationFeeAmount}
                aria-invalid={Boolean(errors.consultationFeeAmount)}
              />
              <input
                aria-label="Consultation fee currency"
                className="profile-control uppercase"
                maxLength={3}
                name="consultationFeeCurrency"
                onChange={updateField}
                value={values.consultationFeeCurrency}
                aria-invalid={Boolean(errors.consultationFeeCurrency)}
              />
            </div>
            <FieldError message={errors.consultationFeeAmount || errors.consultationFeeCurrency} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-semibold" htmlFor="timezone">Timezone</label>
            <input
              className="profile-control"
              id="timezone"
              maxLength={64}
              name="timezone"
              onChange={updateField}
              placeholder="Asia/Kathmandu"
              value={values.timezone}
              aria-invalid={Boolean(errors.timezone)}
            />
            <FieldError message={errors.timezone} />
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white" aria-labelledby="availability-heading">
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
          <div>
            <h2 id="availability-heading" className="text-lg font-bold">Weekly availability</h2>
            <p className="mt-1 text-sm text-gray-600">{values.weeklyAvailability.length}/35 slots</p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-1.5 bg-ink px-4 text-sm font-semibold text-white hover:bg-forest disabled:opacity-50"
            disabled={values.weeklyAvailability.length >= 35}
            onClick={addAvailability}
            type="button"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            Add slot
          </button>
        </div>
        <div className="space-y-3 px-5 py-6 sm:px-7">
          {values.weeklyAvailability.length === 0 ? (
            <p className="border border-dashed border-line px-4 py-7 text-center text-sm text-gray-600">
              No recurring availability has been added.
            </p>
          ) : null}
          {values.weeklyAvailability.map((slot, index) => (
            <div className="grid gap-2 border-b border-line pb-3 sm:grid-cols-[1.2fr_1fr_1fr_40px] sm:border-0 sm:pb-0" key={slot.rowId}>
              <select
                aria-label={`Day for availability slot ${index + 1}`}
                className="profile-control"
                onChange={(event) => updateAvailability(slot.rowId, 'dayOfWeek', event.target.value)}
                value={slot.dayOfWeek}
              >
                {WEEK_DAYS.map((day) => <option key={day} value={day}>{formatDay(day)}</option>)}
              </select>
              <input
                aria-label={`Start time for availability slot ${index + 1}`}
                className="profile-control"
                onChange={(event) => updateAvailability(slot.rowId, 'startTime', event.target.value)}
                type="time"
                value={slot.startTime}
              />
              <input
                aria-label={`End time for availability slot ${index + 1}`}
                className="profile-control"
                onChange={(event) => updateAvailability(slot.rowId, 'endTime', event.target.value)}
                type="time"
                value={slot.endTime}
              />
              <button
                aria-label={`Remove availability slot ${index + 1}`}
                className="grid h-12 w-10 place-items-center border border-line text-gray-600 hover:border-red-400 hover:text-red-700"
                onClick={() => removeAvailability(slot.rowId)}
                title="Remove availability slot"
                type="button"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          ))}
          <FieldError message={errors.weeklyAvailability} />
        </div>
      </section>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Save aria-hidden="true" className="h-5 w-5" />}
        {isSubmitting ? 'Saving profile' : initialProfile ? 'Save changes' : 'Create profile'}
      </button>
    </form>
  );
};

export default LawyerProfileForm;
