import AuthLayout from '../components/AuthLayout.jsx';
import PasswordResetForm from '../components/PasswordResetForm.jsx';

const PasswordResetPage = () => (
  <AuthLayout securityMessage="Reset links are single-use and expire after 15 minutes.">
    <PasswordResetForm />
  </AuthLayout>
);

export default PasswordResetPage;
