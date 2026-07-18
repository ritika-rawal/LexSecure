import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth.js';
import { getRoleHomePath } from '../utils/roleHomePath.js';

const PublicOnlyRoute = () => {
  const { user } = useAuth();

  return user ? <Navigate replace to={getRoleHomePath(user.role)} /> : <Outlet />;
};

export default PublicOnlyRoute;
