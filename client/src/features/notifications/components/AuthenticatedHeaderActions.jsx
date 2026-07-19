import LogoutButton from '../../auth/components/LogoutButton.jsx';
import { USER_ROLES } from '../../auth/constants/userRoles.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import NotificationBell from './NotificationBell.jsx';

const AuthenticatedHeaderActions = () => {
  const { user } = useAuth();
  const supportsNotifications = [
    USER_ROLES.CLIENT,
    USER_ROLES.LAWYER,
  ].includes(user.role);

  return (
    <div className="flex items-start gap-2">
      {supportsNotifications ? <NotificationBell /> : null}
      <LogoutButton />
    </div>
  );
};

export default AuthenticatedHeaderActions;
