import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  KeyRound,
} from 'lucide-react';

import { loginUser } from '../api/login.api.js';
import { verifyMfaLogin } from '../api/mfa.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { getAuthApiError } from '../utils/apiError.js';
import { getRoleHomePath } from '../utils/roleHomePath.js';
import { validateLogin } from '../validation/login.validation.js';
import { normalizeMfaCode, validateMfaCode } from '../validation/mfa.validation.js';
import FieldError from './FieldError.jsx';
import TurnstileWidget from './TurnstileWidget.jsx';

const INITIAL_VALUES = { email: '', password: '' };
const CAPTCHA_ERROR_CODES = new Set(['CAPTCHA_REQUIRED', 'CAPTCHA_INVALID']);

const LoginForm = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useAuth();
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const updateField = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  };

  const validateField = (fieldName) => {
    const fieldErrors = validateLogin(values);
    setErrors((current) => ({ ...current, [fieldName]: fieldErrors[fieldName] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateLogin(values);
    setErrors(validationErrors);
    setSubmitError('');

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await loginUser({ ...values, captchaToken });

      if (response.data.requiresMfa) {
        setRequiresMfa(true);
        setValues(INITIAL_VALUES);
        setMfaCode('');
        setCaptchaRequired(false);
        setCaptchaToken('');
        return;
      }

      setAuthenticatedUser(response.data.user);
      setValues(INITIAL_VALUES);
      setCaptchaRequired(false);
      setCaptchaToken('');
      navigate(getRoleHomePath(response.data.user.role), { replace: true });
    } catch (error) {
      const apiError = getAuthApiError(error, 'Login could not be completed.');

      if (CAPTCHA_ERROR_CODES.has(apiError.code)) {
        setCaptchaRequired(true);
        setCaptchaToken('');
        setCaptchaResetKey((current) => current + 1);
      }

      setSubmitError(apiError.message);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
      setValues((current) => ({ ...current, password: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateMfaCode(mfaCode);

    setSubmitError(validationError);
    if (validationError) return;

    setIsSubmitting(true);

    try {
      const response = await verifyMfaLogin(normalizeMfaCode(mfaCode));
      setAuthenticatedUser(response.data.user);
      setMfaCode('');
      navigate(getRoleHomePath(response.data.user.role), { replace: true });
    } catch (error) {
      setSubmitError(
        getAuthApiError(error, 'Authentication could not be completed.').message,
      );
      setMfaCode('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="mb-2 text-sm font-semibold uppercase text-forest">{requiresMfa ? 'Identity verification' : 'Secure access'}</p>
        <h1 className="text-3xl font-bold text-ink sm:text-4xl">{requiresMfa ? 'Enter authentication code' : 'Sign in to LexSecure'}</h1>
        <p className="mt-3 leading-7 text-gray-600">
          {requiresMfa
            ? 'Use your authenticator app or a one-time recovery code.'
            : 'Use the email and password associated with your account.'}
        </p>
      </div>

      {submitError ? (
        <div className="mb-6 border border-red-300 bg-red-50 p-4 text-sm text-red-800" role="alert">
          <div className="flex gap-2">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        </div>
      ) : null}

      {requiresMfa ? (
        <form className="space-y-5" noValidate onSubmit={handleMfaSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="loginMfaCode">Authenticator or recovery code</label>
            <div className="relative">
              <KeyRound aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
              <input
                autoComplete="one-time-code"
                autoFocus
                className="form-input"
                id="loginMfaCode"
                inputMode="text"
                maxLength={29}
                onChange={(event) => {
                  setMfaCode(event.target.value);
                  setSubmitError('');
                }}
                placeholder="000000"
                value={mfaCode}
              />
            </div>
          </div>
          <button className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
            {isSubmitting ? 'Verifying' : 'Verify and sign in'}
          </button>
          <button
            className="h-11 w-full border border-gray-300 bg-white px-4 text-sm font-semibold"
            disabled={isSubmitting}
            onClick={() => {
              setRequiresMfa(false);
              setMfaCode('');
              setSubmitError('');
            }}
            type="button"
          >
            Back to password
          </button>
        </form>
      ) : (
      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="loginEmail">
            Email address
          </label>
          <div className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
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
          <div className="mb-2 flex items-center justify-between gap-4">
            <label className="block text-sm font-semibold text-ink" htmlFor="loginPassword">
              Password
            </label>
            <Link className="text-sm font-semibold text-forest hover:underline" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
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
              className="absolute right-2 top-2.5 grid h-8 w-8 place-items-center text-gray-600 focus:outline-none focus:ring-2 focus:ring-forest"
              onClick={() => setShowPassword((current) => !current)}
              title={showPassword ? 'Hide password' : 'Show password'}
              type="button"
            >
              {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
            </button>
          </div>
          <FieldError id="loginPassword-error" message={errors.password} />
        </div>

        {captchaRequired ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Security verification</p>
            <TurnstileWidget
              onError={setCaptchaError}
              onToken={(token) => {
                setCaptchaToken(token);
                if (token) setCaptchaError('');
              }}
              resetKey={captchaResetKey}
            />
            <FieldError id="loginCaptcha-error" message={captchaError} />
          </div>
        ) : null}

        <button className="flex h-12 w-full items-center justify-center gap-2 bg-forest px-5 font-semibold text-white hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting || (captchaRequired && !captchaToken)} type="submit">
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
          {isSubmitting ? 'Signing in' : 'Sign in'}
        </button>
      </form>

      )}

      {!requiresMfa ? <p className="mt-7 border-t border-line pt-6 text-center text-sm text-gray-600">
        Need an account?{' '}
        <Link className="font-semibold text-forest hover:underline" to="/register">Create one</Link>
      </p> : null}
    </div>
  );
};

export default LoginForm;
