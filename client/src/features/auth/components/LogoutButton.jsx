import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, LoaderCircle, LogOut } from 'lucide-react';

import { useAuth } from '../hooks/useAuth.js';
import { getAuthApiError } from '../utils/apiError.js';

const LogoutButton = () => {
  const navigate = useNavigate();
  const { isLoggingOut, logout } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = async () => {
    setErrorMessage('');

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setErrorMessage(getAuthApiError(error, 'Logout could not be completed.').message);
    }
  };

  return (
    <div>
      <button
        className="flex h-10 items-center justify-center gap-2 border border-gray-300 bg-white px-4 text-sm font-semibold text-ink hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2 disabled:opacity-60"
        disabled={isLoggingOut}
        onClick={handleLogout}
        type="button"
      >
        {isLoggingOut ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut aria-hidden="true" className="h-4 w-4" />
        )}
        {isLoggingOut ? 'Signing out' : 'Sign out'}
      </button>
      {errorMessage ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-700" role="alert">
          <AlertCircle aria-hidden="true" className="h-4 w-4" />
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
};

export default LogoutButton;
