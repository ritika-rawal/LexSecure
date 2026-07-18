import assert from 'node:assert/strict';
import test from 'node:test';

import { USER_ROLES } from '../src/features/auth/constants/userRoles.js';
import { normalizeUser } from '../src/features/auth/utils/normalizeUser.js';
import { getRoleHomePath } from '../src/features/auth/utils/roleHomePath.js';
import { validateLogin } from '../src/features/auth/validation/login.validation.js';
import {
  validateRegistration,
} from '../src/features/auth/validation/registration.validation.js';

test('normalizeUser retains only safe authentication fields', () => {
  const normalizedUser = normalizeUser({
    id: 'user-id',
    fullName: 'Test Client',
    email: 'client@example.com',
    role: USER_ROLES.CLIENT,
    isActive: true,
    passwordHash: 'must-not-be-retained',
  });

  assert.equal(Object.hasOwn(normalizedUser, 'passwordHash'), false);
  assert.equal(Object.isFrozen(normalizedUser), true);
});

test('normalizeUser rejects an unknown role', () => {
  assert.throws(
    () =>
      normalizeUser({
        id: 'user-id',
        fullName: 'Unknown User',
        email: 'unknown@example.com',
        role: 'unknown',
      }),
    /invalid user data/,
  );
});

test('role home paths separate client and lawyer accounts', () => {
  assert.equal(getRoleHomePath(USER_ROLES.CLIENT), '/client/account');
  assert.equal(getRoleHomePath(USER_ROLES.LAWYER), '/lawyer/account');
  assert.equal(getRoleHomePath('unknown'), '/unauthorized');
});

test('login validation rejects malformed credentials', () => {
  const errors = validateLogin({ email: 'invalid-email', password: '' });

  assert.ok(errors.email);
  assert.ok(errors.password);
});

test('registration validation rejects admin self-registration', () => {
  const errors = validateRegistration({
    fullName: 'Test Admin',
    email: 'admin@example.com',
    password: 'SecureTest!2026',
    confirmPassword: 'SecureTest!2026',
    role: USER_ROLES.ADMIN,
  });

  assert.ok(errors.role);
});
