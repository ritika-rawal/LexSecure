import AuthLayout from '../components/AuthLayout.jsx';
import VerifyEmailStatus from '../components/VerifyEmailStatus.jsx';

const VerifyEmailPage = () => (
  <AuthLayout securityMessage="Verification links are single-use and expire after 24 hours.">
    <VerifyEmailStatus />
  </AuthLayout>
);

export default VerifyEmailPage;
