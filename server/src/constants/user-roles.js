export const USER_ROLES = Object.freeze({
  CLIENT: 'client',
  LAWYER: 'lawyer',
  ADMIN: 'admin',
});

export const USER_ROLE_VALUES = Object.freeze(Object.values(USER_ROLES));

export const SELF_REGISTRATION_ROLE_VALUES = Object.freeze([
  USER_ROLES.CLIENT,
  USER_ROLES.LAWYER,
]);
