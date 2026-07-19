import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAdminAccountInput } from '../src/validators/admin-account.validator.js';

test('normalizes valid admin account input', () => {
  const result = validateAdminAccountInput({
    fullName: '  Course Administrator  ',
    email: '  ADMIN@EXAMPLE.COM  ',
    password: 'StrongPassword1!',
  });

  assert.deepEqual(result, {
    fullName: 'Course Administrator',
    email: 'admin@example.com',
    password: 'StrongPassword1!',
  });
});

test('rejects missing or malformed admin account input', () => {
  assert.throws(
    () => validateAdminAccountInput({
      fullName: 'A',
      email: 'not-an-email',
      password: 'weak',
    }),
    (error) => {
      assert.equal(error.name, 'AdminAccountValidationError');
      assert.match(error.message, /ADMIN_FULL_NAME/);
      assert.match(error.message, /ADMIN_EMAIL/);
      assert.match(error.message, /ADMIN_PASSWORD/);
      return true;
    },
  );
});

test('rejects a password without every required character class', () => {
  assert.throws(
    () => validateAdminAccountInput({
      fullName: 'Course Administrator',
      email: 'admin@example.com',
      password: 'alllowercasepassword',
    }),
    (error) => {
      assert.match(error.message, /uppercase/);
      assert.match(error.message, /number/);
      assert.match(error.message, /symbol/);
      return true;
    },
  );
});
