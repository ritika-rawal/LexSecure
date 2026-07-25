import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';

import { confirmEmailVerification } from '../api/email-verification.api.js';
import { getAuthApiError } from '../utils/apiError.js';

const STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  ERROR: 'error',
};

const VerifyEmailStatus = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState(STATUS.PENDING);
  const [message, setMessage] = useState('');
  const submittedTokenRef = useRef('');

  useEffect(() => {
    if (!token) {
      setStatus(STATUS.ERROR);
      setMessage('This verification link is missing its token.');
      return;
    }

    // Verification tokens are single-use, so this guard stops React's
    // development-mode double-invocation of effects (StrictMode) from
    // submitting the same token twice and treating the resulting
    // already-used error as the outcome of a fresh attempt. The request
    // always runs to completion and updates the screen, regardless of
    // which effect invocation started it.
    if (submittedTokenRef.current === token) return;
    submittedTokenRef.current = token;

    (async () => {
      try {
        const response = await confirmEmailVerification(token);
        setStatus(STATUS.SUCCESS);
        setMessage(response.message);
      } catch (error) {
        setStatus(STATUS.ERROR);
        setMessage(getAuthApiError(error, 'Verification could not be completed.').message);
      }
    })();
  }, [token]);

  return (
    <div className="verify-email-status">
      <div className="mb-6">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-forest">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
          Email verification
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Verify your email</h1>
      </div>

      {status === STATUS.PENDING ? (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white/80 p-4 text-sm text-gray-700 shadow-sm backdrop-blur-md" role="status">
          <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
          <p>Verifying your email address&hellip;</p>
        </div>
      ) : null}

      {status === STATUS.SUCCESS ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50/90 p-4 text-emerald-900 shadow-sm backdrop-blur-md" role="status">
          <div className="flex gap-3">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{message}</p>
          </div>
        </div>
      ) : null}

      {status === STATUS.ERROR ? (
        <div className="rounded-lg border border-red-300 bg-red-50/90 p-4 text-sm text-red-800 shadow-sm backdrop-blur-md" role="alert">
          <div className="flex gap-2">
            <AlertCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            <p>{message}</p>
          </div>
        </div>
      ) : null}

      <p className="mt-6 border-t border-white/80 pt-5 text-center text-sm text-gray-600">
        <Link className="font-semibold text-forest hover:underline" to="/login">Back to sign in</Link>
      </p>
    </div>
  );
};

export default VerifyEmailStatus;
