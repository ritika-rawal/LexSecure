import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { getCurrentUser } from '../api/session.api.js';
import { AUTH_STATUS } from '../constants/authStatus.js';
import { normalizeUser } from '../utils/normalizeUser.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(AUTH_STATUS.LOADING);
  const [initializationError, setInitializationError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    const restoreSession = async () => {
      try {
        const response = await getCurrentUser({ signal: controller.signal });
        setUser(normalizeUser(response.data.user));
        setStatus(AUTH_STATUS.AUTHENTICATED);
        setInitializationError(null);
      } catch (error) {
        if (axios.isCancel(error)) {
          return;
        }

        setUser(null);
        setStatus(AUTH_STATUS.UNAUTHENTICATED);

        if (!axios.isAxiosError(error) || error.response?.status !== 401) {
          setInitializationError('Unable to verify the existing session.');
        }
      }
    };

    restoreSession();

    return () => controller.abort();
  }, []);

  const setAuthenticatedUser = useCallback((authenticatedUser) => {
    setUser(normalizeUser(authenticatedUser));
    setStatus(AUTH_STATUS.AUTHENTICATED);
    setInitializationError(null);
  }, []);

  const value = useMemo(
    () => ({
      initializationError,
      setAuthenticatedUser,
      status,
      user,
    }),
    [initializationError, setAuthenticatedUser, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
