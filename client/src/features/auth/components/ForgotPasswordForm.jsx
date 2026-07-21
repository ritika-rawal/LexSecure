import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, LoaderCircle, Mail } from 'lucide-react';

import { requestPasswordReset } from '../api/password-reset.api.js';
import { getAuthApiError } from '../utils/apiError.js';
import { validatePasswordResetRequest } from '../validation/password-reset.validation.js';
import FieldError from './FieldError.jsx';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validatePasswordResetRequest(email);
    setFieldError(validationError);
    setSubmitError('');
    setFeedback('');

    if (validationError) return;

    setIsSubmitting(true);
    try {
      const response = await requestPasswordReset(email);
      setFeedback(response.message);
      setEmail('');
    } catch (error) {
      const apiError = getAuthApiError(error, 'Password reset could not be requested.');
      setSubmitError(apiError.message);
      setFieldError(apiError.fieldErrors.email || '');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase text-forest">Account recovery</p>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">Reset your password</h1>
        <p className="mt-3 leading-7 text-gray-600">
          Enter your account email. Reset instructions are sent only when an active account matches.
        </p>
      </div>

      {submitError ? (
        <div className="mb-6 flex gap-2 border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
          <p>{submitError}</p>
        </div>
      ) : null}

      {feedback ? (
        <div className="mb-6 flex gap-2 border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
          <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
          <p>{feedback}</p>
        </div>
      ) : null}

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="resetEmail">
            Email address
          </label>
          <div className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
            <input
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
              className="form-input"
              id="resetEmail"
              maxLength={254}
              onBlur={() => setFieldError(validatePasswordResetRequest(email))}
              onChange={(event) => {
                setEmail(event.target.value);
                setFieldError('');
                setSubmitError('');
              }}
              placeholder="name@example.com"
              spellCheck="false"
              type="email"
              value={email}
              aria-describedby={fieldError ? 'resetEmail-error' : undefined}
              aria-invalid={Boolean(fieldError)}
            />
          </div>
          <FieldError id="resetEmail-error" message={fieldError} />
        </div>

        <button className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Mail aria-hidden="true" className="h-5 w-5" />}
          {isSubmitting ? 'Requesting reset' : 'Send reset instructions'}
        </button>
      </form>

      <Link className="mt-7 flex items-center justify-center gap-2 border-t border-line pt-6 text-sm font-semibold text-forest hover:underline" to="/login">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
};

export default ForgotPasswordForm;
