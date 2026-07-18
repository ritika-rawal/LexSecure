import { Navigate, Route, Routes } from 'react-router-dom';
import { LoaderCircle, Scale } from 'lucide-react';

import ProtectedRoute from '../features/auth/components/ProtectedRoute.jsx';
import PublicOnlyRoute from '../features/auth/components/PublicOnlyRoute.jsx';
import { AUTH_STATUS } from '../features/auth/constants/authStatus.js';
import { USER_ROLES, USER_ROLE_VALUES } from '../features/auth/constants/userRoles.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import AccountPage from '../features/auth/pages/AccountPage.jsx';
import LoginPage from '../features/auth/pages/LoginPage.jsx';
import RegisterPage from '../features/auth/pages/RegisterPage.jsx';
import UnauthorizedPage from '../features/auth/pages/UnauthorizedPage.jsx';
import { getRoleHomePath } from '../features/auth/utils/roleHomePath.js';

const AppRoutes = () => {
  const { status, user } = useAuth();

  if (status === AUTH_STATUS.LOADING) {
    return (
      <main className="grid min-h-screen place-items-center bg-paper px-5 text-ink" aria-busy="true" aria-live="polite">
        <div className="text-center">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center bg-ink text-white">
            <Scale aria-hidden="true" className="h-6 w-6" />
          </span>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-forest" />
            Restoring secure session
          </div>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.CLIENT]} />}>
        <Route path="/client/account" element={<AccountPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={[USER_ROLES.LAWYER]} />}>
        <Route path="/lawyer/account" element={<AccountPage />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={USER_ROLE_VALUES} />}>
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to={user ? getRoleHomePath(user.role) : '/login'} />} />
    </Routes>
  );
};

export default AppRoutes;
