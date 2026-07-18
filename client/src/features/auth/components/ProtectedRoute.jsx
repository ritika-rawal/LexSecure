import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { AUTH_STATUS } from '../constants/authStatus.js';
import { useAuth } from '../hooks/useAuth.js';

const ProtectedRoute = ({ allowedRoles }) => {
  const location = useLocation();
  const { status, user } = useAuth();

  if (status === AUTH_STATUS.UNAUTHENTICATED || !user) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace to="/unauthorized" />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
