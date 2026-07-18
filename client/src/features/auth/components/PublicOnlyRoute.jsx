import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';
import { getRoleHomePath } from '../utils/roleHomePath.js';

const PublicOnlyRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate replace to={getRoleHomePath(user.role)} />;
  }

  return <Outlet />;
};

export default PublicOnlyRoute;
