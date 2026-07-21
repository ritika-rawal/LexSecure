# LexSecure Sprint 4 In-Progress Security Audit

## 1. Sprint Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 4 - Advanced Security and Security Validation |
| Goal | Close high-risk cross-cutting weaknesses and prepare penetration-testing evidence |
| Functional status | In progress |
| Current increment | Session-bound CSRF protection |
| Security status | Static design review complete; dynamic verification remains |
| Audit type | Continuous white-box security review |

Sprint 4 starts by protecting the complete cookie-authenticated API against
cross-site request forgery. LexSecure now issues a cryptographically random
token bound to the server-side session and requires it in a custom header on
every state-changing request.

The protection includes anonymous session mutations such as registration and
login, authenticated mutations such as logout, bookings, uploads, messages,
reviews, and administrator decisions, and future unsafe-method routes mounted
after the global middleware.

This report remains in progress. Rate limiting, account lockout, MFA, password
recovery, deeper header/CSP hardening, and dynamic penetration testing are not
complete.

## 2. Delivered Functionality

- `GET /api/auth/csrf-token` creates or returns the current session token.
- Tokens contain 256 bits of cryptographically secure randomness.
- Tokens use URL-safe base64 and a strict fixed-length format.
- The token remains server-side in the MongoDB-backed session.
- Unsafe HTTP methods require the token through `X-CSRF-Token`.
- `GET`, `HEAD`, and `OPTIONS` remain available without a token.
- Token comparison uses Node.js constant-time comparison.
- Missing, malformed, expired, and cross-session tokens return HTTP 403.
- CSRF failures expose a fixed public error code for controlled client recovery.
- Token responses use `Cache-Control: private, no-store`.
- CORS explicitly permits the CSRF header only for configured origins.
- Axios retrieves and caches tokens centrally for all feature modules.
- Concurrent unsafe requests share one in-flight token request.
- Successful login and logout clear the browser's cached token.
- A CSRF rejection clears the stale token and retries exactly once.
- Authentication failures clear cached CSRF state.

## 3. API Surface

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/auth/csrf-token` | Obtain a token bound to the current session | Public session |

Every route using `POST`, `PUT`, `PATCH`, or `DELETE` must send:

```text
X-CSRF-Token: <43-character session token>
```

## 4. Security Design

| Control | Implementation | Security benefit |
| --- | --- | --- |
| Synchronizer token | Random token stored in the server-side session | Binds unsafe requests to a session value unavailable to an unrelated origin |
| Strong entropy | 32 random bytes from `node:crypto` | Makes token prediction computationally infeasible |
| Strict token format | Fixed URL-safe base64 pattern | Rejects malformed and ambiguous values before comparison |
| Constant-time comparison | `timingSafeEqual` after equal-length checks | Reduces token-prefix timing leakage |
| Global unsafe-method middleware | Protection runs after session loading and before all API routes | Avoids missing protection on individual mutation endpoints |
| Login CSRF coverage | Login and registration require a token | Reduces forced-login and unwanted-account creation attacks |
| Session regeneration handling | Successful login clears the old browser token | Prevents reuse after the session ID changes |
| Logout handling | Successful logout clears the browser token | Removes token state associated with a destroyed session |
| No-store token response | Token endpoint disables caching | Reduces persistence in shared and intermediary caches |
| Custom request header | Browser forms cannot directly add `X-CSRF-Token` | Blocks ordinary cross-origin form submissions |
| Restricted CORS header | Only configured frontend origins receive CORS approval | Prevents arbitrary JavaScript origins from sending credentialed custom headers |
| Single safe retry | Only a named CSRF rejection is retried once | Recovers from expiration without duplicating executed business operations |
| Fixed public error code | Internally assigned `CSRF_TOKEN_INVALID` | Enables recovery without exposing session or expected-token information |

SameSite cookies and CORS are treated as supporting controls, not replacements
for CSRF tokens. An XSS vulnerability executing inside the trusted origin could
still retrieve the token; XSS prevention and CSP therefore remain independent
requirements.

## 5. Files Added or Modified

| File | Purpose |
| --- | --- |
| `server/src/constants/csrf.js` | Central header, method, token-format, and error-code definitions |
| `server/src/utils/csrf-token.js` | Secure token generation and constant-time comparison |
| `server/src/middleware/csrf.middleware.js` | Global unsafe-method verification boundary |
| `server/src/controllers/csrf.controller.js` | Issues and persists non-cacheable session tokens |
| `server/src/routes/auth.routes.js` | Registers the token endpoint before authentication routes |
| `server/src/config/cors.config.js` | Allows the CSRF header from configured frontend origins |
| `server/src/middleware/error.middleware.js` | Returns internally assigned public recovery codes |
| `server/src/app.js` | Applies CSRF verification after session middleware and before routes |
| `client/src/security/csrfToken.js` | Retrieves, validates, caches, and clears browser token state |
| `client/src/api/httpClient.js` | Adds tokens to unsafe requests and performs one controlled retry |

## 6. Known Gaps and Audit Targets

| Area | Current status | Required work or audit |
| --- | --- | --- |
| Rate limiting | Not implemented | Add route-specific and identity-aware limits without weakening error privacy |
| Account lockout | Model fields exist but enforcement is absent | Add bounded failures, timed lockout, and safe recovery |
| MFA | Model flags exist but TOTP is absent | Add encrypted secret storage, enrolment confirmation, recovery codes, and login challenge |
| Password recovery | Not implemented | Add expiring single-use tokens and session invalidation |
| Duplicate session middleware | Existing known finding remains open | Remove the duplicate only in a dedicated session-hardening increment and re-audit lifecycle behavior |
| CSRF denial telemetry | Rejections are not audit logged | Add bounded monitoring after rate limiting to avoid attacker-driven log exhaustion |
| Token rotation | Token rotates through session regeneration, not on a timer | Verify this lifecycle is sufficient for the coursework threat model |
| XSS interaction | Trusted-origin script can request the token | Continue output encoding, sink review, CSP hardening, and stored-XSS testing |
| Origin validation | CORS validates supplied origins; CSRF middleware validates the token | Consider explicit Origin/Referer checks as an additional production signal |
| Multi-tab behavior | Tabs share one session token | Verify login/logout transitions and stale-tab recovery |
| API clients | Non-browser clients must first establish a session and request a token | Document the expected sequence for Burp and manual API evidence |
| Automated tests | Not executed by project decision | Record manual evidence for every protected mutation category |

Cross-sprint findings in `docs/SECURITY_BUG_REPORT.md` remain open unless a
specific Sprint 4 increment explicitly closes and retests them.

## 7. Dynamic Evidence Still Required

1. Request a token and confirm a session cookie and 43-character token are
   returned with `private, no-store`.
2. Submit registration without the header and confirm HTTP 403.
3. Submit login without the header and confirm HTTP 403.
4. Submit a valid login with a same-session token and confirm success.
5. Reuse the pre-login token after session regeneration and confirm rejection.
6. Obtain the new-session token and confirm authenticated mutation succeeds.
7. Submit logout without a token and confirm rejection without session
   destruction.
8. Test booking, cancellation, rescheduling, profile updates, lawyer decisions,
   document uploads, messages, reviews, notification updates, and export using
   missing, malformed, valid, and cross-session tokens.
9. Send a valid token from a different authenticated session and confirm HTTP
   403.
10. Send tokens with altered first, middle, and final characters and confirm
    identical generic failures.
11. Attempt a cross-origin HTML form POST and confirm no business mutation.
12. Attempt credentialed JavaScript from a disallowed origin and confirm CORS
    prevents access and custom-header submission.
13. Confirm token values do not appear in application logs, audit events,
    URLs, error bodies, or frontend storage.
14. Confirm GET, HEAD, and preflight OPTIONS behavior remains available.
15. Trigger a controlled stale-token response and confirm Axios retries once,
    while the mutation executes no more than once.
16. Open multiple tabs and verify login, logout, session expiry, and stale-token
    recovery behavior.
17. Verify multipart document uploads include the CSRF header and retain their
    existing file validation.
18. Verify administrator mutations receive the same protection as client and
    lawyer mutations.

Use synthetic accounts and legal data only during testing.

## 8. Evidence to Capture

- Token endpoint response headers and redacted response structure.
- Burp request/response pair for missing-token registration and login.
- Valid same-session login followed by rejected pre-regeneration token reuse.
- Cross-session token substitution returning the generic 403 response.
- Cross-origin form attempt showing no state change.
- Disallowed-origin preflight/CORS evidence.
- Representative protected client, lawyer, and administrator mutations.
- Multipart upload carrying the custom CSRF header.
- Browser network trace showing one token retrieval shared across concurrent
  unsafe requests.
- Stale-token trace showing one safe retry and one resulting mutation.
- Log and storage inspection showing no persisted token outside the session
  collection.
- Git commit for this increment created by the project owner.

## 9. Sprint 4 Work Remaining

1. Add rate limiting and account lockout.
2. Implement TOTP MFA and recovery controls.
3. Implement secure password recovery if required by the coursework scope.
4. Complete security-header and CSP hardening.
5. Resolve the duplicate session middleware finding in a dedicated increment.
6. Perform the OWASP/PortSwigger manual penetration-testing matrix.
7. Fix confirmed vulnerabilities and capture retest evidence.
8. Complete deployment, CI/CD, and final report assets required by the brief.

## 10. Current Assessment

The static CSRF design protects the full current mutation surface with a
session-bound, high-entropy synchronizer token and centralized frontend
delivery. It correctly accounts for login session regeneration, logout session
destruction, concurrent requests, stale-token recovery, multipart uploads, and
future state-changing routes.

This control is not considered security-closed until the role, route,
cross-origin, cross-session, multi-tab, and retry matrices above are executed.
Rate limiting, account lockout, MFA, XSS/CSP hardening, and the duplicate session
middleware remain significant open Sprint 4 work.
