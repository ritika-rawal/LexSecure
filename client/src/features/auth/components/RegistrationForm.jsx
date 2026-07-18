import { useState } from 'react';
import axios from 'axios';
import {
  AlertCircle,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
} from 'lucide-react';

import { registerUser } from '../api/registration.api.js';
import { validateRegistration } from '../validation/registration.validation.js';

const INITIAL_VALUES = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'client',
};

const getApiError = (error) => {
  if (!axios.isAxiosError(error)) {
    return { message: 'Something went wrong. Please try again.', fieldErrors: {} };
  }

  if (!error.response) {
    return {
      message: 'Unable to reach LexSecure. Check that the backend is running.',
      fieldErrors: {},
    };
  }

  const details = Array.isArray(error.response.data?.details)
    ? error.response.data.details
    : [];

  const fieldErrors = details.reduce((errors, detail) => {
    if (typeof detail.field === 'string' && typeof detail.message === 'string') {
      errors[detail.field] = detail.message;
    }

    return errors;
  }, {});

  return {
    message: error.response.data?.message || 'Registration could not be completed.',
    fieldErrors,
  };
};

const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-red-700">
      <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
      {message}
    </p>
  ) : null;

const RegistrationForm = () => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
    setSubmitError('');
  };

  const validateField = (fieldName) => {
    const validationErrors = validateRegistration(values);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: validationErrors[fieldName],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateRegistration(values);
    setErrors(validationErrors);
    setSubmitError('');
    setRegisteredUser(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser(values);
      setRegisteredUser(response.data.user);
      setValues(INITIAL_VALUES);
    } catch (error) {
      const apiError = getApiError(error);
      setSubmitError(apiError.message);
      setErrors((currentErrors) => ({ ...currentErrors, ...apiError.fieldErrors }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase text-forest">Secure registration</p>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Create your LexSecure account</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
          Register as a client seeking legal support or as a lawyer offering consultations.
        </p>
      </div>

      {registeredUser ? (
        <div
          className="mb-6 border border-emerald-300 bg-emerald-50 p-4 text-emerald-900"
          role="status"
        >
          <div className="flex gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Account created successfully</p>
              <p className="mt-1 text-sm">
                {registeredUser.fullName} is registered as a {registeredUser.role}.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div
          className="mb-6 border border-red-300 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <div className="flex gap-2">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        </div>
      ) : null}

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="fullName">
            Full name
          </label>
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500"
            />
            <input
              autoComplete="name"
              className="form-input"
              id="fullName"
              maxLength={100}
              name="fullName"
              onBlur={() => validateField('fullName')}
              onChange={updateField}
              placeholder="Your full name"
              type="text"
              value={values.fullName}
              aria-describedby={errors.fullName ? 'fullName-error' : undefined}
              aria-invalid={Boolean(errors.fullName)}
            />
          </div>
          <FieldError id="fullName-error" message={errors.fullName} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="email">
            Email address
          </label>
          <div className="relative">
            <Mail
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500"
            />
            <input
              autoCapitalize="none"
              autoComplete="email"
              className="form-input"
              id="email"
              maxLength={254}
              name="email"
              onBlur={() => validateField('email')}
              onChange={updateField}
              placeholder="name@example.com"
              spellCheck="false"
              type="email"
              value={values.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          <FieldError id="email-error" message={errors.email} />
        </div>

        <fieldset>
          <legend className="mb-2 block text-sm font-semibold text-ink">Account type</legend>
          <div className="grid grid-cols-2 gap-2" aria-describedby={errors.role ? 'role-error' : undefined}>
            {[
              { value: 'client', label: 'Client', Icon: UserRound },
              { value: 'lawyer', label: 'Lawyer', Icon: BriefcaseBusiness },
            ].map(({ value, label, Icon }) => (
              <label
                className={`role-option ${values.role === value ? 'role-option-selected' : ''}`}
                key={value}
              >
                <input
                  checked={values.role === value}
                  className="sr-only"
                  name="role"
                  onChange={updateField}
                  type="radio"
                  value={value}
                />
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <FieldError id="role-error" message={errors.role} />
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500"
              />
              <input
                autoComplete="new-password"
                className="form-input pr-11"
                id="password"
                maxLength={128}
                name="password"
                onBlur={() => validateField('password')}
                onChange={updateField}
                placeholder="At least 12 characters"
                type={showPassword ? 'text' : 'password'}
                value={values.password}
                aria-describedby={errors.password ? 'password-error' : 'password-help'}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-2.5 grid h-8 w-8 place-items-center text-gray-600 hover:text-ink focus:outline-none focus:ring-2 focus:ring-forest"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                title={showPassword ? 'Hide password' : 'Show password'}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="h-5 w-5" />
                ) : (
                  <Eye aria-hidden="true" className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password ? (
              <FieldError id="password-error" message={errors.password} />
            ) : (
              <p id="password-help" className="mt-1.5 text-xs leading-5 text-gray-500">
                Use uppercase, lowercase, a number, and a symbol.
              </p>
            )}
          </div>

          <div>
            <label
              className="mb-2 block text-sm font-semibold text-ink"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>
            <div className="relative">
              <LockKeyhole
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500"
              />
              <input
                autoComplete="new-password"
                className="form-input"
                id="confirmPassword"
                maxLength={128}
                name="confirmPassword"
                onBlur={() => validateField('confirmPassword')}
                onChange={updateField}
                placeholder="Repeat your password"
                type={showPassword ? 'text' : 'password'}
                value={values.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                aria-invalid={Boolean(errors.confirmPassword)}
              />
            </div>
            <FieldError id="confirmPassword-error" message={errors.confirmPassword} />
          </div>
        </div>

        <button
          className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white transition-colors hover:bg-forest-dark focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              Creating account
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>
    </div>
  );
};

export default RegistrationForm;
