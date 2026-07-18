import { Navigate, Route, Routes } from 'react-router-dom';

import RegisterPage from '../features/auth/pages/RegisterPage.jsx';

const AppRoutes = () => (
  <Routes>
    <Route path="/register" element={<RegisterPage />} />
    <Route path="*" element={<Navigate to="/register" replace />} />
  </Routes>
);

export default AppRoutes;
