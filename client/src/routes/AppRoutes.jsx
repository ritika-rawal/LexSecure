import { Navigate, Route, Routes } from 'react-router-dom';
import { LoaderCircle, Scale } from 'lucide-react';

import { AUTH_STATUS } from '../features/auth/constants/authStatus.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';

const AppRoutes = () => {
  const { status } = useAuth();

  if (status === AUTH_STATUS.LOADING) {
    return (
      <main
        className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="text-center">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center bg-ink text-white">
            <Scale aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Restoring secure session
          </div>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
