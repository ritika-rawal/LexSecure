import { AuthProvider } from './features/auth/context/AuthContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
