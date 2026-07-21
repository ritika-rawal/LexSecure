import AuthLayout from '../components/AuthLayout.jsx';
import ForgotPasswordForm from '../components/ForgotPasswordForm.jsx';

const ForgotPasswordPage = () => (
  <AuthLayout securityMessage="Recovery requests never reveal whether an account exists.">
    <ForgotPasswordForm />
  </AuthLayout>
);

export default ForgotPasswordPage;
