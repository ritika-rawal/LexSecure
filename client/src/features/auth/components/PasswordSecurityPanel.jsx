import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';

import { changePassword } from '../api/password.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { getAuthApiError } from '../utils/apiError.js';
import { validatePasswordChange } from '../validation/password-change.validation.js';
import FieldError from './FieldError.jsx';
import PasswordStrengthFeedback from './PasswordStrengthFeedback.jsx';

const INITIAL_VALUES = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const PasswordSecurityPanel = () => {
  const navigate = useNavigate();
  const { clearAuthenticatedUser, user } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const updateField = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validatePasswordChange(values);
    setErrors(validationErrors);
    setSubmitError('');

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await changePassword(values);
      clearAuthenticatedUser();
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (error) {
      const apiError = getAuthApiError(error, 'Password could not be changed.');
      setSubmitError(apiError.message);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setValues((current) => ({ ...current, currentPassword: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiryText = user.passwordExpiresAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })
        .format(new Date(user.passwordExpiresAt))
    : 'Set when your password is next changed';

  return (
    <section className="mt-8 border-t border-line bg-white" aria-labelledby="password-security-heading">
      <div className="border-b border-line px-5 py-5 sm:px-7">
        <div className="flex items-center gap-3">
          <KeyRound aria-hidden="true" className="h-5 w-5 text-forest" />
          <div>
            <h2 id="password-security-heading" className="text-lg font-bold">Password security</h2>
            <p className="mt-1 text-sm text-gray-600">Expires: {expiryText}. Recently used passwords cannot be reused.</p>
          </div>
        </div>
      </div>

      <form className="space-y-5 px-5 py-6 sm:px-7" noValidate onSubmit={handleSubmit}>
        {submitError ? (
          <div className="flex gap-2 border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        ) : null}

        <div className="grid gap-5 lg:grid-cols-3">
          {[
            { name: 'currentPassword', label: 'Current password', autoComplete: 'current-password' },
            { name: 'newPassword', label: 'New password', autoComplete: 'new-password' },
            { name: 'confirmPassword', label: 'Confirm new password', autoComplete: 'new-password' },
          ].map((field) => (
            <div key={field.name}>
              <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={field.name}>{field.label}</label>
              <div className="relative">
                <KeyRound aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
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
                {field.name === 'currentPassword' ? (
                  <button
                    aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    className="absolute right-2 top-2.5 grid h-8 w-8 place-items-center text-gray-600 focus:outline-none focus:ring-2 focus:ring-forest"
                    onClick={() => setShowPasswords((current) => !current)}
                    title={showPasswords ? 'Hide passwords' : 'Show passwords'}
                    type="button"
                  >
                    {showPasswords ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                  </button>
                ) : null}
              </div>
              <FieldError id={`${field.name}-error`} message={errors[field.name]} />
              {field.name === 'newPassword' ? <PasswordStrengthFeedback password={values.newPassword} /> : null}
            </div>
          ))}
        </div>

        <button className="flex h-11 items-center justify-center gap-2 bg-forest px-5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : <KeyRound aria-hidden="true" className="h-5 w-5" />}
          {isSubmitting ? 'Changing password' : 'Change password'}
        </button>
      </form>
    </section>
  );
};

export default PasswordSecurityPanel;
