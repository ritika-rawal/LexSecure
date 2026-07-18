import { USER_ROLES } from '../constants/userRoles.js';

const ROLE_HOME_PATHS = Object.freeze({
  [USER_ROLES.CLIENT]: '/client/account',
  [USER_ROLES.LAWYER]: '/lawyer/account',
  [USER_ROLES.ADMIN]: '/admin/lawyer-profiles',
});

export const getRoleHomePath = (role) => ROLE_HOME_PATHS[role] || '/unauthorized';
