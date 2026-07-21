import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';

import { confirmPasswordReset } from '../api/password-reset.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { getAuthApiError } from '../utils/apiError.js';
import {
  PASSWORD_RESET_TOKEN_PATTERN,
  validateNewPassword,
} from '../validation/password-reset.validation.js';
import FieldError from './FieldError.jsx';
import PasswordStrengthFeedback from './PasswordStrengthFeedback.jsx';

const INITIAL_VALUES = { password: '', confirmPassword: '' };

const PasswordResetForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearAuthenticatedUser } = useAuth();
  const [token, setToken] = useState(() => searchParams.get('token') || '');
  const hasValidTokenShape = PASSWORD_RESET_TOKEN_PATTERN.test(token);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    if (searchParams.has('token')) {
      // Remove bearer material from browser history after capturing it in memory.
      navigate('/reset-password', { replace: true });
    }
  }, [navigate, searchParams]);

  const updateField = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateNewPassword(values);
    setErrors(validationErrors);
    setSubmitError('');

    if (!hasValidTokenShape || Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await confirmPasswordReset({ token, password: values.password });
      clearAuthenticatedUser();
      setToken('');
      setValues(INITIAL_VALUES);
      setIsComplete(true);
    } catch (error) {
      const apiError = getAuthApiError(error, 'Password reset could not be completed.');
      setSubmitError(apiError.message);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setValues(INITIAL_VALUES);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isComplete) {
    return (
      <div>
        <CheckCircle2 aria-hidden="true" className="mb-5 h-10 w-10 text-emerald-700" />
        <h1 className="text-3xl font-bold text-ink">Password updated</h1>
        <p className="mt-3 leading-7 text-gray-600">Existing sessions have been invalidated. Sign in again using your new password and MFA if enabled.</p>
        <Link className="mt-7 flex h-12 items-center justify-center bg-forest px-5 font-semibold text-white hover:bg-forest-dark" to="/login">Continue to sign in</Link>
      </div>
    );
  }

  if (!hasValidTokenShape) {
    return (
      <div>
        <AlertCircle aria-hidden="true" className="mb-5 h-10 w-10 text-red-700" />
        <h1 className="text-3xl font-bold text-ink">Reset link unavailable</h1>
        <p className="mt-3 leading-7 text-gray-600">This password reset link is incomplete or invalid. Request a new link to continue.</p>
        <Link className="mt-7 flex h-12 items-center justify-center bg-forest px-5 font-semibold text-white hover:bg-forest-dark" to="/forgot-password">Request another link</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase text-forest">Secure recovery</p>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Choose a new password</h1>
        <p className="mt-3 leading-7 text-gray-600">Use a unique password you have not used for another service.</p>
      </div>

      {submitError ? (
        <div className="mb-6 flex gap-2 border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
          <p>{submitError}</p>
        </div>
      ) : null}

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        {[
          { name: 'password', label: 'New password', autoComplete: 'new-password' },
          { name: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
        ].map((field) => (
          <div key={field.name}>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={field.name}>{field.label}</label>
            <div className="relative">
              <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                autoComplete={field.autoComplete}
                className="form-input pr-11"
                id={field.name}
                maxLength={128}
                name={field.name}
                onChange={updateField}
                type={showPasswords ? 'text' : 'password'}
                value={values[field.name]}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                aria-invalid={Boolean(errors[field.name])}
              />
              <button aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'} className="absolute right-2 top-2.5 grid h-8 w-8 place-items-center text-gray-600 focus:outline-none focus:ring-2 focus:ring-forest" onClick={() => setShowPasswords((current) => !current)} title={showPasswords ? 'Hide passwords' : 'Show passwords'} type="button">
                {showPasswords ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
              </button>
            </div>
            <FieldError id={`${field.name}-error`} message={errors[field.name]} />
            {field.name === 'password' ? (
              <PasswordStrengthFeedback password={values.password} />
            ) : null}
          </div>
        ))}

        <button className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <LockKeyhole aria-hidden="true" className="h-5 w-5" />}
          {isSubmitting ? 'Updating password' : 'Update password'}
        </button>
      </form>
    </div>
  );
};

export default PasswordResetForm;
