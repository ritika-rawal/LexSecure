import assert from 'node:assert/strict';
import test from 'node:test';

import { SESSION_COOKIE_NAME } from '../src/config/session.config.js';
import { USER_ROLES } from '../src/constants/user-roles.js';
import {
  authorizeRoles,
  requireAuthentication,
} from '../src/middleware/auth.middleware.js';

test('requireAuthentication rejects a request without an authenticated session', async () => {
  await assert.rejects(
    () => requireAuthentication({ session: {} }, {}, () => {}),
    (error) => error.statusCode === 401 && error.message === 'Authentication required.',
  );
});

test('requireAuthentication destroys a session containing an invalid user id', async () => {
  let destroyed = false;
  let clearedCookieName;

  const req = {
    session: {
      user: { id: 'not-a-mongodb-object-id' },
      destroy(callback) {
        destroyed = true;
        callback();
      },
    },
  };
  const res = {
    clearCookie(cookieName) {
      clearedCookieName = cookieName;
    },
  };

  await assert.rejects(
    () => requireAuthentication(req, res, () => {}),
    (error) => error.statusCode === 401,
  );

  assert.equal(destroyed, true);
  assert.equal(clearedCookieName, SESSION_COOKIE_NAME);
});

test('authorizeRoles permits an authenticated user with an allowed role', () => {
  let nextCalled = false;
  const middleware = authorizeRoles(USER_ROLES.CLIENT, USER_ROLES.LAWYER);

  middleware({ user: { role: USER_ROLES.CLIENT } }, {}, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authorizeRoles rejects an authenticated user with a disallowed role', () => {
  const middleware = authorizeRoles(USER_ROLES.LAWYER);

  assert.throws(
    () => middleware({ user: { role: USER_ROLES.CLIENT } }, {}, () => {}),
    (error) => error.statusCode === 403,
  );
});

test('authorizeRoles rejects use before authentication middleware', () => {
  const middleware = authorizeRoles(USER_ROLES.CLIENT);

  assert.throws(
    () => middleware({}, {}, () => {}),
    (error) => error.statusCode === 401,
  );
});

test('authorizeRoles rejects invalid middleware configuration', () => {
  assert.throws(() => authorizeRoles(), TypeError);
  assert.throws(() => authorizeRoles('unknown-role'), TypeError);
});
