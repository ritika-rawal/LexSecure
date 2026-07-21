import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';

import {
  beginMfaSetup,
  disableMfa,
  enableMfa,
} from '../api/mfa.api.js';
import { useAuth } from '../hooks/useAuth.js';
import { getAuthApiError } from '../utils/apiError.js';
import {
  normalizeMfaCode,
  validateMfaCode,
} from '../validation/mfa.validation.js';

const MfaSecurityPanel = () => {
  const { setAuthenticatedUser, user } = useAuth();
  const [setup, setSetup] = useState(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [isDisabling, setIsDisabling] = useState(false);
  const [disableValues, setDisableValues] = useState({ password: '', code: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const startSetup = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setFeedback('');

    try {
      const response = await beginMfaSetup();
      setSetup(response.data.setup);
      setConfirmationCode('');
    } catch (error) {
      setErrorMessage(getAuthApiError(error, 'MFA setup could not start.').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmSetup = async () => {
    const validationError = validateMfaCode(confirmationCode, false);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await enableMfa(normalizeMfaCode(confirmationCode));
      setAuthenticatedUser(response.data.user);
      setRecoveryCodes(response.data.recoveryCodes);
      setSetup(null);
      setConfirmationCode('');
      setFeedback(response.message);
    } catch (error) {
      setErrorMessage(getAuthApiError(error, 'MFA could not be enabled.').message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join('\n'));
      setFeedback('Recovery codes copied.');
      setErrorMessage('');
    } catch {
      setErrorMessage('Recovery codes could not be copied.');
    }
  };

  const downloadRecoveryCodes = () => {
    const blob = new Blob(
      [`LexSecure MFA recovery codes\n\n${recoveryCodes.join('\n')}\n`],
      { type: 'text/plain;charset=utf-8' },
    );
    const objectUrl = URL.createObjectURL(blob);
    const link = window.document.createElement('a');

    link.href = objectUrl;
    link.download = 'lexsecure-mfa-recovery-codes.txt';
    link.style.display = 'none';
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    setFeedback('Recovery codes downloaded.');
  };

  const submitDisable = async () => {
    const codeError = validateMfaCode(disableValues.code);

    if (!disableValues.password || codeError) {
      setErrorMessage(codeError || 'Enter your current password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setFeedback('');

    try {
      const response = await disableMfa({
        password: disableValues.password,
        code: normalizeMfaCode(disableValues.code),
      });
      setAuthenticatedUser(response.data.user);
      setDisableValues({ password: '', code: '' });
      setIsDisabling(false);
      setRecoveryCodes([]);
      setFeedback(response.message);
    } catch (error) {
      setErrorMessage(getAuthApiError(error, 'MFA could not be disabled.').message);
      setDisableValues((current) => ({ ...current, password: '' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-8 border-y border-line bg-white" aria-labelledby="mfa-heading">
      <div className="flex flex-col justify-between gap-5 px-5 py-6 sm:flex-row sm:items-start sm:px-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center bg-emerald-50 text-forest">
            <ShieldCheck aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold" id="mfa-heading">Multi-factor authentication</h2>
            <p className="mt-1 text-sm text-gray-600">
              Status: <span className="font-semibold text-ink">{user.mfaEnabled ? 'Enabled' : 'Not enabled'}</span>
            </p>
          </div>
        </div>

        {!user.mfaEnabled && !setup && recoveryCodes.length === 0 ? (
          <button
            className="flex h-11 shrink-0 items-center justify-center gap-2 bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-dark disabled:opacity-60"
            disabled={isSubmitting}
            onClick={startSetup}
            type="button"
          >
            {isSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <KeyRound aria-hidden="true" className="h-4 w-4" />}
            Enable MFA
          </button>
        ) : null}

        {user.mfaEnabled && !isDisabling && recoveryCodes.length === 0 ? (
          <button
            className="flex h-11 shrink-0 items-center justify-center gap-2 border border-red-300 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
            onClick={() => {
              setIsDisabling(true);
              setErrorMessage('');
              setFeedback('');
            }}
            type="button"
          >
            <ShieldOff aria-hidden="true" className="h-4 w-4" />
            Disable MFA
          </button>
        ) : null}
      </div>

      {setup ? (
        <div className="grid gap-6 border-t border-line px-5 py-6 sm:px-7 md:grid-cols-[240px_minmax(0,1fr)]">
          <img
            alt="LexSecure authenticator setup QR code"
            className="h-60 w-60 border border-line bg-white"
            height="240"
            src={setup.qrCodeDataUrl}
            width="240"
          />
          <div>
            <label className="block text-sm font-semibold" htmlFor="mfa-confirmation-code">Authenticator code</label>
            <input
              autoComplete="one-time-code"
              className="form-input mt-2 max-w-sm"
              id="mfa-confirmation-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setConfirmationCode(event.target.value.replace(/\D/g, ''));
                setErrorMessage('');
              }}
              placeholder="000000"
              value={confirmationCode}
            />
            <p className="mt-4 text-xs text-gray-500">Manual key</p>
            <code className="mt-1 block max-w-full break-all border border-line bg-gray-50 px-3 py-2 text-sm">{setup.secret}</code>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="h-10 bg-forest px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} onClick={confirmSetup} type="button">
                Confirm and enable
              </button>
              <button className="h-10 border border-gray-300 bg-white px-4 text-sm font-semibold" disabled={isSubmitting} onClick={() => setSetup(null)} type="button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {recoveryCodes.length > 0 ? (
        <div className="border-t border-line px-5 py-6 sm:px-7">
          <h3 className="font-bold">Recovery codes</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Save these codes now. Do not enter them on this page. Each one is an emergency sign-in code that can be used once if your authenticator is unavailable.
          </p>
          <ul className="mt-4 grid gap-2 font-mono text-sm sm:grid-cols-2">
            {recoveryCodes.map((code) => <li className="border border-line bg-gray-50 px-3 py-2" key={code}>{code}</li>)}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="flex h-10 items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold" onClick={copyRecoveryCodes} type="button"><Copy aria-hidden="true" className="h-4 w-4" />Copy</button>
            <button className="flex h-10 items-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold" onClick={downloadRecoveryCodes} type="button"><Download aria-hidden="true" className="h-4 w-4" />Download</button>
            <button className="h-10 bg-ink px-4 text-sm font-semibold text-white" onClick={() => setRecoveryCodes([])} type="button">I saved these codes</button>
          </div>
        </div>
      ) : null}

      {isDisabling ? (
        <div className="border-t border-line px-5 py-6 sm:px-7">
          <p className="mb-4 max-w-2xl text-sm text-red-700">
            This action removes two-factor protection. Continue only when you intentionally want to disable MFA.
          </p>
          <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold" htmlFor="mfa-disable-password">Current password</label>
              <input className="form-input mt-2" id="mfa-disable-password" maxLength={128} onChange={(event) => setDisableValues((current) => ({ ...current, password: event.target.value }))} type="password" value={disableValues.password} />
            </div>
            <div>
              <label className="block text-sm font-semibold" htmlFor="mfa-disable-code">Authenticator or recovery code</label>
              <input autoComplete="one-time-code" className="form-input mt-2" id="mfa-disable-code" maxLength={29} onChange={(event) => setDisableValues((current) => ({ ...current, code: event.target.value }))} value={disableValues.code} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="h-10 bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={isSubmitting} onClick={submitDisable} type="button">Confirm disable</button>
            <button className="h-10 border border-gray-300 bg-white px-4 text-sm font-semibold" disabled={isSubmitting} onClick={() => setIsDisabling(false)} type="button">Cancel</button>
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="flex items-start gap-2 border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-7" role="alert"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{errorMessage}</p> : null}
      {feedback ? <p className="flex items-start gap-2 border-t border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-800 sm:px-7" role="status"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{feedback}</p> : null}
    </section>
  );
};

export default MfaSecurityPanel;
