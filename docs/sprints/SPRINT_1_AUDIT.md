# LexSecure Sprint 1 Retrospective Audit

## 1. Sprint Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 1 - Foundation and Authentication |
| Goal | Establish the MERN foundation and role-aware session authentication |
| Functional status | Complete |
| Security status | Partially complete; Sprint 4 controls and retesting remain |
| Audit type | Retrospective white-box review |
| Evidence baseline | Commits `e3775db` through `512f215` |

Sprint 1 delivered a working client, lawyer, and administrator authentication
foundation. Users can self-register as clients or lawyers, authenticate through
server-side sessions, restore their session, sign out, and reach role-restricted
frontend routes. Administrator creation is deliberately separated from public
registration.

## 2. Delivered Functionality

### Backend

- Express application foundation using ES Modules and MVC separation.
- MongoDB connection through Mongoose with fail-fast startup.
- Central application, CORS, Helmet, session, and environment configuration.
- Central validation, not-found handling, async handling, and error middleware.
- User model with client, lawyer, and administrator role constants.
- Secure client/lawyer self-registration.
- Password hashing using bcrypt.
- Session-based login, logout, and current-user endpoints.
- MongoDB-backed production-appropriate session storage.
- Authentication and RBAC middleware.
- Administrator bootstrap command that does not expose public admin registration.

### Frontend

- React registration and login interfaces.
- Client-side validation paired with server-side authoritative validation.
- Authentication context and session restoration.
- Public-only and protected route components.
- Role-aware navigation for clients, lawyers, and administrators.
- Logout workflow and unauthorized-access view.

## 3. API Surface

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/health` | API health status | Public |
| `POST` | `/api/auth/register` | Client/lawyer registration | Public |
| `POST` | `/api/auth/login` | Create authenticated session | Public |
| `POST` | `/api/auth/logout` | Destroy current session | Session-aware |
| `GET` | `/api/auth/me` | Restore current authenticated user | Authenticated |

## 4. Security Controls Implemented

| Control | Implementation | Security benefit |
| --- | --- | --- |
| Password hashing | bcrypt with controlled password length | Protects plaintext passwords and limits oversized bcrypt input |
| Password policy | Minimum 12 characters with character-class checks | Raises resistance to simple guessing |
| Role allowlist | Only client and lawyer accepted during self-registration | Prevents public administrator creation |
| Session regeneration | Session identifier regenerated after password verification | Mitigates session fixation |
| Server-side sessions | MongoDB session store | Avoids trusting client-held authorization state |
| Cookie controls | `HttpOnly`, `SameSite=Lax`, production-only `Secure` | Reduces script access and some cross-site request risk |
| Active-user check | User reloaded on protected requests | Invalidates sessions for disabled/deleted users |
| RBAC middleware | Server-side role checks | Prevents reliance on frontend routing for authorization |
| Safe responses | Password and MFA fields excluded | Prevents credential-material disclosure |
| Generic login failure | Same invalid-credential message | Reduces login-based account enumeration |
| CORS allowlist | Exact configured frontend origins | Prevents credentialed browser reads by arbitrary origins |
| Helmet | Default HTTP security headers | Provides baseline browser hardening |
| Body limits | 100 KB JSON and form limit | Reduces memory-exhaustion exposure |

## 5. Commit Evidence

| Commit | Evidence |
| --- | --- |
| `e3775db` | Initial project baseline |
| `952144d` | Secure Express foundation |
| `160ab78` | Express and MongoDB integration |
| `e950be1` | User model and role constants |
| `6770f35` | Registration backend |
| `d28c8e2` | Session login and logout |
| `4df9923` | Registration interface |
| `5e87bd1` | Login interface |
| `d991196` | Authentication context and session restoration |
| `0ed578a` | Frontend logout workflow |
| `512f215` | Sprint 1 authentication and RBAC completion |

## 6. Audit Findings and Known Gaps

The identifiers below map to
[`SECURITY_BUG_REPORT.md`](../SECURITY_BUG_REPORT.md).

| ID | Gap | Severity | Sprint relationship |
| --- | --- | --- | --- |
| LS-001 | Authentication throttling and account lockout are not enforced | Critical | Baseline coursework requirement deferred to Sprint 4 |
| LS-002 | MFA fields exist but no TOTP challenge is enforced | High | Planned Sprint 4 authentication control |
| LS-003 | Email ownership is not verified before sensitive access | High | Authentication workflow remains incomplete |
| LS-007 | No comprehensive CSRF-token mechanism | Medium | Planned Sprint 4 browser security control |
| LS-008 | Registration reveals whether an email already exists | Medium | Authentication response discrepancy |
| LS-009 | Session middleware is currently registered twice | Provisionally High | Regression introduced after Sprint 1; affects the authentication foundation |

Additional incomplete coursework requirements:

- Password reuse prevention and expiry policy are not implemented.
- Password reset and secure recovery are not implemented.
- CAPTCHA and suspicious-login detection are not implemented.
- Audit logs for registration, login, logout, and authorization failures are not implemented.
- No session/device management interface exists.

## 7. Testing Evidence Still Required

No automated tests were added or run during the recent feature work at the
student's request. The following manual evidence must be captured later:

1. Registration rejects administrator self-registration and unsupported fields.
2. Password hashes are present in MongoDB while plaintext passwords are absent.
3. Login returns one generic message for unknown email and incorrect password.
4. The session identifier changes after login.
5. A pre-login or pre-regeneration identifier cannot access `/api/auth/me`.
6. Logout invalidates the identifier in the MongoDB session collection.
7. Client, lawyer, and administrator route-access matrices return the expected
   `200`, `401`, and `403` responses.
8. Disabled users lose access on their next protected request.
9. Cookie flags are recorded in development and production-like environments.
10. LS-009 is dynamically tested under concurrent login/logout requests.

## 8. Evidence to Capture for the Coursework

- Burp request and response for successful and unsuccessful registration.
- MongoDB screenshot showing password hash and safe user fields.
- Browser cookie screenshot showing `HttpOnly`, `SameSite`, expiry, and
  production `Secure`.
- Before/after session identifiers demonstrating regeneration.
- RBAC request matrix for all three roles.
- Git history showing incremental authentication commits.
- Screenshots and video evidence for LS-001/LS-002 before and after Sprint 4 fixes.

## 9. Sprint Assessment

Sprint 1 is **functionally complete** because registration, session
authentication, logout, session restoration, and RBAC are operational.

Sprint 1 is **not security complete**. It remains dependent on Sprint 4 for
rate limiting, lockout, MFA, CSRF protection, email verification/recovery,
auditing, vulnerability remediation, and formal retesting.

## 10. Report-Ready Summary

Sprint 1 established LexSecure's secure server and authentication foundation.
The implementation uses bcrypt password hashing, MongoDB-backed server-side
sessions, session regeneration, restrictive cookie attributes, role allowlists,
safe response mapping, and server-enforced RBAC. A retrospective review found
that the functional authentication workflow is complete but advanced controls,
including MFA, account lockout, CSRF protection, verified identity, and formal
security monitoring, remain outstanding. These gaps are recorded for Sprint 4
remediation and before/after penetration-test evidence.
