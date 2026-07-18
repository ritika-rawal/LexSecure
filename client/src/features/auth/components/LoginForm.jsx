import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import { loginUser } from '../api/login.api.js';
import { getAuthApiError } from '../utils/apiError.js';
import { validateLogin } from '../validation/login.validation.js';
import FieldError from './FieldError.jsx';

const INITIAL_VALUES = {
  email: '',
  password: '',
};

const LoginForm = () => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [name]: undefined }));
    setSubmitError('');
  };

  const validateField = (fieldName) => {
    const validationErrors = validateLogin(values);
    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: validationErrors[fieldName],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validateLogin(values);
    setErrors(validationErrors);
    setSubmitError('');
    setAuthenticatedUser(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginUser(values);
      setAuthenticatedUser(response.data.user);
      setValues(INITIAL_VALUES);
    } catch (error) {
      const apiError = getAuthApiError(error, 'Login could not be completed.');
      setSubmitError(apiError.message);
      setErrors((currentErrors) => ({ ...currentErrors, ...apiError.fieldErrors }));
      setValues((currentValues) => ({ ...currentValues, password: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authenticatedUser) {
    return (
      <div className="py-5" role="status">
        <span className="mb-6 grid h-14 w-14 place-items-center bg-emerald-100 text-forest">
          <ShieldCheck aria-hidden="true" className="h-8 w-8" />
        </span>
        <p className="mb-2 text-sm font-semibold uppercase text-forest">Session established</p>
        <h1 className="text-3xl font-bold text-ink">Welcome, {authenticatedUser.fullName}</h1>
        <div className="mt-6 border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex gap-3">
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">You are securely signed in</p>
              <p className="mt-1 text-sm">
                Authenticated as {authenticatedUser.email} ({authenticatedUser.role}).
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase text-forest">Secure access</p>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Sign in to LexSecure</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-gray-600">
          Use the email and password associated with your account.
        </p>
      </div>

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
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="loginEmail">
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
              autoFocus
              className="form-input"
              id="loginEmail"
              maxLength={254}
              name="email"
              onBlur={() => validateField('email')}
              onChange={updateField}
              placeholder="name@example.com"
              spellCheck="false"
              type="email"
              value={values.email}
              aria-describedby={errors.email ? 'loginEmail-error' : undefined}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          <FieldError id="loginEmail-error" message={errors.email} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="loginPassword">
            Password
          </label>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500"
            />
            <input
              autoComplete="current-password"
              className="form-input pr-11"
              id="loginPassword"
              maxLength={128}
              name="password"
              onBlur={() => validateField('password')}
              onChange={updateField}
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={values.password}
              aria-describedby={errors.password ? 'loginPassword-error' : undefined}
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
          <FieldError id="loginPassword-error" message={errors.password} />
        </div>

        <button
          className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white transition-colors hover:bg-forest-dark focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
              Signing in
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <p className="mt-7 border-t border-line pt-6 text-center text-sm text-gray-600">
        Need an account?{' '}
        <Link className="font-semibold text-forest underline-offset-4 hover:underline" to="/register">
          Create one
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
