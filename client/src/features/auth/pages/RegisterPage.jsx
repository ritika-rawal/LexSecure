import AuthLayout from '../components/AuthLayout.jsx';
import RegistrationForm from '../components/RegistrationForm.jsx';

const RegisterPage = () => (
  <AuthLayout securityMessage="Your password is protected before storage." visualMode="editorial">
    <RegistrationForm />
  </AuthLayout>
);

export default RegisterPage;
