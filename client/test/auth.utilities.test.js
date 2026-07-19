import assert from 'node:assert/strict';
import test from 'node:test';

import { USER_ROLES } from '../src/features/auth/constants/userRoles.js';
import { normalizeUser } from '../src/features/auth/utils/normalizeUser.js';
import { getRoleHomePath } from '../src/features/auth/utils/roleHomePath.js';
import { validateLogin } from '../src/features/auth/validation/login.validation.js';
import { validateRegistration } from '../src/features/auth/validation/registration.validation.js';

test('normalizes only safe user fields', () => {
  const user = normalizeUser({
    id: 'id',
    fullName: 'Test User',
    email: 'test@example.com',
    role: USER_ROLES.CLIENT,
    passwordHash: 'excluded',
  });
  assert.equal(Object.hasOwn(user, 'passwordHash'), false);
  assert.equal(Object.isFrozen(user), true);
});

test('maps each role to its protected home route', () => {
  assert.equal(getRoleHomePath(USER_ROLES.CLIENT), '/client/account');
  assert.equal(getRoleHomePath(USER_ROLES.LAWYER), '/lawyer/account');
  assert.equal(getRoleHomePath(USER_ROLES.ADMIN), '/admin/lawyer-profiles');
});

test('rejects malformed login and admin self-registration', () => {
  assert.ok(validateLogin({ email: 'invalid', password: '' }).email);
  assert.ok(validateRegistration({
    fullName: 'Test Admin',
    email: 'admin@example.com',
    password: 'SecureTest!2026',
    confirmPassword: 'SecureTest!2026',
    role: USER_ROLES.ADMIN,
  }).role);
});
