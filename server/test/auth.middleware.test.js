import assert from 'node:assert/strict';
import test from 'node:test';

import { USER_ROLES } from '../src/constants/user-roles.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../src/middleware/auth.middleware.js';

test('requires an authenticated session', async () => {
  await assert.rejects(
    () => requireAuthentication({ session: {} }, {}, () => {}),
    (error) => error.statusCode === 401,
  );
});

test('allows configured roles', () => {
  let nextCalled = false;
  authorizeRoles(USER_ROLES.CLIENT)(
    { user: { role: USER_ROLES.CLIENT } },
    {},
    () => {
      nextCalled = true;
    },
  );
  assert.equal(nextCalled, true);
});

test('rejects a disallowed role', () => {
  const middleware = authorizeRoles(USER_ROLES.LAWYER);
  assert.throws(
    () => middleware({ user: { role: USER_ROLES.CLIENT } }, {}, () => {}),
    (error) => error.statusCode === 403,
  );
});
