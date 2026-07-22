import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { getAuthApiError } from '../utils/apiError.js';
import { validateRegistration } from '../validation/registration.validation.js';
import FieldError from './FieldError.jsx';
import PasswordStrengthFeedback from './PasswordStrengthFeedback.jsx';

const INITIAL_VALUES = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'client',
};

const RegistrationForm = () => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = ({ target: { name, value } }) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmitError('');
  };

  const validateField = (fieldName) => {
    const fieldErrors = validateRegistration(values);
    setErrors((current) => ({ ...current, [fieldName]: fieldErrors[fieldName] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateRegistration(values);
    setErrors(validationErrors);
    setSubmitError('');
    setRegisteredUser(null);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await registerUser(values);
      setRegisteredUser(response.data.user);
      setValues(INITIAL_VALUES);
    } catch (error) {
      const apiError = getAuthApiError(error, 'Registration could not be completed.');
      setSubmitError(apiError.message);
      setErrors((current) => ({ ...current, ...apiError.fieldErrors }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-form">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-forest">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          Secure registration
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Create your LexSecure account</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600 sm:text-base">
          Register as a client seeking legal support or as a lawyer offering consultations.
        </p>
      </div>

      {registeredUser ? (
        <div className="mb-5 rounded-lg border border-emerald-300 bg-emerald-50/90 p-4 text-emerald-900 shadow-sm backdrop-blur-md" role="status">
          <div className="flex gap-3">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p><strong>Account created.</strong> {registeredUser.fullName} is registered as a {registeredUser.role}.</p>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="mb-5 rounded-lg border border-red-300 bg-red-50/90 p-4 text-sm text-red-800 shadow-sm backdrop-blur-md" role="alert">
          <div className="flex gap-2">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{submitError}</p>
          </div>
        </div>
      ) : null}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        <div>
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="fullName">Full name</label>
          <div className="relative">
            <UserRound aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
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
          <label className="mb-2 block text-sm font-semibold text-ink" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
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
          <legend className="mb-2 text-sm font-semibold text-ink">Account type</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'client', label: 'Client', Icon: UserRound },
              { value: 'lawyer', label: 'Lawyer', Icon: BriefcaseBusiness },
            ].map(({ value, label, Icon }) => (
              <label className={`role-option ${values.role === value ? 'role-option-selected' : ''}`} key={value}>
                <input checked={values.role === value} className="sr-only" name="role" onChange={updateField} type="radio" value={value} />
                <Icon aria-hidden="true" className="h-5 w-5" />
                {label}
              </label>
            ))}
          </div>
          <FieldError id="role-error" message={errors.role} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { name: 'password', label: 'Password', placeholder: 'At least 12 characters' },
            { name: 'confirmPassword', label: 'Confirm password', placeholder: 'Repeat your password' },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="mb-2 block text-sm font-semibold text-ink" htmlFor={name}>{label}</label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  autoComplete="new-password"
                  className="form-input pr-11"
                  id={name}
                  maxLength={128}
                  name={name}
                  onBlur={() => validateField(name)}
                  onChange={updateField}
                  placeholder={placeholder}
                  type={showPassword ? 'text' : 'password'}
                  value={values[name]}
                  aria-describedby={errors[name] ? `${name}-error` : undefined}
                  aria-invalid={Boolean(errors[name])}
                />
                {name === 'password' ? (
                  <button
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-2.5 grid h-8 w-8 place-items-center text-gray-600 focus:outline-none focus:ring-2 focus:ring-forest"
                    onClick={() => setShowPassword((current) => !current)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    type="button"
                  >
                    {showPassword ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
                  </button>
                ) : null}
              </div>
              <FieldError id={`${name}-error`} message={errors[name]} />
              {name === 'password' ? (
                <PasswordStrengthFeedback password={values.password} />
              ) : null}
            </div>
          ))}
        </div>

        <button className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-forest px-5 font-semibold text-white shadow-lg shadow-forest/20 hover:-translate-y-0.5 hover:bg-forest-dark disabled:opacity-60" disabled={isSubmitting} type="submit">
          {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
          {isSubmitting ? 'Creating account' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 border-t border-white/80 pt-5 text-center text-sm text-gray-600">
        Already registered?{' '}
        <Link className="font-semibold text-forest hover:underline" to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default RegistrationForm;
