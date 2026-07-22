import AuthLayout from '../components/AuthLayout.jsx';
import LoginForm from '../components/LoginForm.jsx';

const LoginPage = () => (
  <AuthLayout securityMessage="Your session identifier is protected from browser scripts." visualMode="login">
    <LoginForm />
  </AuthLayout>
);

export default LoginPage;
