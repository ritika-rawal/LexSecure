# LexSecure Security Bug Report

## 1. Report Information

| Field | Value |
| --- | --- |
| Application | LexSecure Lawyer Appointment and Client Management System |
| Assessment type | Internal white-box security review |
| Assessment date | 19 July 2026 |
| Branch | `Sprint3` |
| Baseline | Commit `a0f25ff` plus the current working tree |
| Scope | React client, Express API, session authentication, MongoDB data flows, appointment business logic, and installed dependencies |
| Methodology | OWASP WSTG-style source review, attack-path analysis, configuration review, and dependency audit |
| Testing constraint | Identification only; no vulnerabilities were fixed and no destructive exploitation was performed |

This report supports the coursework requirement to document vulnerability name,
category, CVSS v3.1 rating, technical explanation, exploitation path, evidence,
remediation, and retesting. The findings are based on the application as it
currently exists. No artificial vulnerabilities were added.

## 2. Executive Summary

The review identified one Critical, five confirmed High, one provisionally
High, and two Medium exploitable security issues. The most serious attack chain combines unrestricted login
attempts with single-factor authentication, allowing credential stuffing or
password guessing to compromise client, lawyer, or administrator accounts.

The application already has useful protections: passwords are hashed with
bcrypt, sessions are stored in MongoDB, session identifiers are regenerated
after login, authorization checks are applied to appointment resources, CORS
uses an explicit origin allowlist, React escapes rendered text by default, and
appointment reservations use unique database indexes. Those controls do not
remove the findings below.

| ID | Finding | Severity | CVSS v3.1 | Status |
| --- | --- | --- | --- | --- |
| LS-001 | Unlimited authentication attempts enable credential attacks | Critical | 9.8 | Confirmed |
| LS-002 | MFA is not enforced for privileged or sensitive accounts | High | 8.8 | Confirmed |
| LS-003 | Unverified email registration enables identity pre-hijacking | High | 8.6 | Confirmed |
| LS-004 | Appointment reservation abuse enables schedule exhaustion | High | 8.2 | Confirmed |
| LS-005 | Vulnerable Vite development server dependency permits file disclosure | High | 7.5 | Confirmed by dependency audit |
| LS-006 | Vulnerable archive extraction dependency creates supply-chain risk | High | 8.2 | Confirmed by dependency audit |
| LS-007 | Login CSRF can force a victim into an attacker-controlled account | Medium | 6.5 | Source-confirmed; browser PoC required |
| LS-008 | Registration responses disclose whether an email is registered | Medium | 5.3 | Confirmed |
| LS-009 | Duplicate session middleware risks session desynchronization | High | 8.1 | Source-confirmed; dynamic PoC required |

## 3. Detailed Findings

### LS-001: Unlimited Authentication Attempts Enable Credential Attacks

**Category:** CWE-307, Improper Restriction of Excessive Authentication Attempts  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Severity:** Critical  
**CVSS:** 9.8 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`)

#### Technical explanation

`POST /api/auth/login` is publicly accessible and has no IP rate limit,
account-based throttling, exponential delay, CAPTCHA, or account lockout. The
User model contains `failedLoginAttempts` and `lockedUntil`, but the login
controller never reads or updates them. The dependency tree also does not
contain `express-rate-limit`.

All roles, including administrators, authenticate through the same unprotected
endpoint. An attacker can therefore perform online password guessing and
credential stuffing at machine speed.

#### Source evidence

- [`auth.routes.js`](../server/src/routes/auth.routes.js#L17) exposes the login endpoint.
- [`auth.controller.js`](../server/src/controllers/auth.controller.js#L59) validates the password and immediately creates a session after a match.
- [`User.model.js`](../server/src/models/User.model.js#L56) defines lockout fields that are not enforced.

#### Safe reproduction

1. Send repeated invalid `POST /api/auth/login` requests for one known account.
2. Record the response status and timing.
3. Confirm that requests continue returning `401` rather than `429`.
4. Confirm that no increasing delay or temporary lockout occurs.
5. Stop after a small number of requests; a high-volume attack is unnecessary for evidence.

#### Impact

Successful guessing or credential stuffing gives the attacker the victim's
entire role. Administrator compromise permits lawyer approval decisions;
lawyer compromise exposes confidential client summaries and schedule control;
client compromise exposes legal consultation data and enables appointment
changes.

#### Recommended remediation

Apply layered IP and account rate limits, exponential backoff, temporary
lockout, CAPTCHA after suspicious failures, monitoring, and generic responses.
Ensure controls cover login, registration, MFA, password reset, and other
sensitive endpoints.

#### Retest criteria

Repeated failures must trigger `429` or a temporary account lock without
revealing whether the account exists. A successful login after the lockout
period must reset the failure counter.

---

### LS-002: MFA Is Not Enforced for Privileged or Sensitive Accounts

**Category:** CWE-308, Use of Single-Factor Authentication  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Severity:** High  
**CVSS:** 8.8 (`AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H`)

#### Technical explanation

The User model contains `mfaEnabled` and `mfaSecret`, but login does not evaluate
either field. A correct password immediately results in a fully authenticated
session for clients, lawyers, and administrators. There is no second-stage
session state such as `mfaPending`.

This turns any stolen, phished, reused, or guessed password into immediate
account takeover. The risk is highest for administrator and lawyer accounts.

#### Source evidence

- [`User.model.js`](../server/src/models/User.model.js#L47) defines unused MFA fields.
- [`auth.controller.js`](../server/src/controllers/auth.controller.js#L77) creates the authenticated session immediately after password verification.

#### Safe reproduction

1. Use a test account with valid credentials.
2. Submit the credentials to `POST /api/auth/login`.
3. Observe that the response creates an authenticated session without a TOTP challenge.
4. Request a role-protected endpoint and confirm access is granted immediately.

#### Impact

Compromised credentials provide full role access without an independent factor.
For lawyers and administrators, this can expose confidential legal information
or alter approval and appointment workflows.

#### Recommended remediation

Implement TOTP enrollment and recovery codes, encrypt MFA secrets at rest,
require MFA for privileged roles, use a short-lived pre-authentication session,
rate-limit MFA verification, and prevent recovery from becoming a bypass.

#### Retest criteria

A correct password for an MFA-enabled account must not authorize normal API
routes until a valid second factor is supplied. Replayed and expired TOTP codes
must be rejected.

---

### LS-003: Unverified Email Registration Enables Identity Pre-Hijacking

**Category:** CWE-345, Insufficient Verification of Data Authenticity  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Severity:** High  
**CVSS:** 8.6 (`AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:H/A:L`)

#### Technical explanation

Registration accepts ownership of any syntactically valid email address. New
users are stored with `isEmailVerified: false`, but login does not check this
state. An attacker can register a victim's email first, choose a password, and
operate the account indefinitely. The legitimate owner is then blocked by the
unique email index.

For a legal-services platform, an email address is an identity and
communication attribute. Allowing an attacker to claim it creates account
pre-hijacking and impersonation risk.

#### Source evidence

- [`User.model.js`](../server/src/models/User.model.js#L42) defaults verification to false.
- [`auth.controller.js`](../server/src/controllers/auth.controller.js#L17) creates the account without an ownership challenge.
- [`auth.controller.js`](../server/src/controllers/auth.controller.js#L59) allows login without checking `isEmailVerified`.

#### Safe reproduction

1. Register a test email address that the tester controls.
2. Observe that the returned user has `isEmailVerified: false`.
3. Log in immediately with the new credentials.
4. Confirm access to client or lawyer account functionality.

#### Impact

Attackers can impersonate users, reserve another person's email address, create
legal appointments under a false identity, and frustrate account recovery.
Mass creation also strengthens the schedule-exhaustion attack in LS-004.

#### Recommended remediation

Issue single-use, expiring email-verification tokens; block sensitive actions
until verification; prevent token disclosure in logs; and provide a secure
recovery process for pre-hijacked addresses.

#### Retest criteria

An unverified account must not access sensitive workflows. Tokens must expire,
be single-use, and become invalid after successful verification.

---

### LS-004: Appointment Reservation Abuse Enables Schedule Exhaustion

**Category:** CWE-400, Uncontrolled Resource Consumption  
**OWASP:** A04:2021 Insecure Design / business-logic abuse  
**Severity:** High  
**CVSS:** 8.2 (`AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:H`)

#### Technical explanation

Any self-registered client can create pending appointments. Each pending request
sets `isSlotReserved: true`, immediately blocking the lawyer's slot. There is no
per-client pending limit, booking velocity limit, verified-email requirement,
cooldown, or mechanism to expire abandoned pending requests.

The unique reservation indexes correctly stop double-booking, but this also
makes malicious pending requests effective denial-of-service reservations.
An attacker can register multiple unverified accounts and reserve every
available slot.

#### Source evidence

- [`auth.routes.js`](../server/src/routes/auth.routes.js#L16) permits unrestricted self-registration.
- [`appointment.routes.js`](../server/src/routes/appointment.routes.js#L29) exposes appointment creation to clients.
- [`appointment.service.js`](../server/src/services/appointment.service.js#L161) creates pending appointments with active reservations.
- [`Appointment.model.js`](../server/src/models/Appointment.model.js#L223) enforces reservation uniqueness.

#### Safe reproduction

1. Use controlled test client accounts and a test lawyer profile.
2. Book several distinct available slots without lawyer approval.
3. Confirm every request remains pending and each slot disappears from valid booking attempts.
4. Confirm there is no per-account pending limit or automatic expiration.
5. Cancel the test records after capturing evidence.

#### Impact

Attackers can deny real clients access to consultations, disrupt lawyer
schedules, create administrative workload, and reduce trust in the platform.

#### Recommended remediation

Require verified accounts, rate-limit booking, cap pending appointments per
client, expire unreviewed reservations, detect linked-account abuse, and alert
on abnormal booking patterns.

#### Retest criteria

Excess pending bookings must be rejected without reserving more slots.
Abandoned pending requests must release reservations after the defined period.

---

### LS-005: Vulnerable Vite Development Server Permits File Disclosure

**Category:** CWE-22 / CWE-200, Path Traversal and Information Exposure  
**OWASP:** A06:2021 Vulnerable and Outdated Components  
**Severity:** High  
**CVSS:** 7.5 (`AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`)

#### Technical explanation

The installed dependency tree contains Vite `5.4.21`. `npm audit` reports the
high-severity Windows `server.fs.deny` bypass
([GHSA-fx2h-pf6j-xcff](https://github.com/advisories/GHSA-fx2h-pf6j-xcff))
and additional development-server disclosure advisories.

The client development command starts Vite on `localhost:3000`, which reduces
network exposure but does not remove same-machine browser, malicious local
process, DNS-rebinding, or accidental host-configuration risks. This is a
development-environment finding, not a normal production API endpoint.

#### Source evidence

- [`client/package.json`](../client/package.json#L8) starts the Vite development server.
- [`client/package.json`](../client/package.json#L25) permits the vulnerable Vite major version.
- `package-lock.json` resolves Vite `5.4.21`.
- `npm audit --json` reported the advisory on 19 July 2026.

#### Safe reproduction

Use only the advisory's non-destructive proof of concept against the local
development server and request a harmless test file created for the assessment.
Do not request `.env`, SSH keys, browser data, or other real secrets.

#### Impact

Successful exploitation can disclose source files, environment data, or local
developer files, potentially exposing session secrets or credentials.

#### Recommended remediation

Upgrade Vite to a non-vulnerable supported release, review breaking changes,
keep the dev server bound to loopback, and never expose it as a production
server.

#### Retest criteria

The advisory PoC must return a denial or not-found response after upgrade.
`npm audit` must no longer report the Vite advisory.

---

### LS-006: Vulnerable Archive Extraction Dependency Creates Supply-Chain Risk

**Category:** CWE-22 / CWE-59, Path Traversal and Link Following  
**OWASP:** A06:2021 Vulnerable and Outdated Components  
**Severity:** High  
**CVSS:** 8.2 (`AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:L/A:N`)

#### Technical explanation

The backend directly depends on bcrypt `5.1.1`, which depends on
`@mapbox/node-pre-gyp 1.0.11` and `tar 6.2.1`. `npm audit` reports multiple
high-severity node-tar extraction vulnerabilities, including hardlink path
traversal
([GHSA-34x7-hfp2-rc4v](https://github.com/advisories/GHSA-34x7-hfp2-rc4v)).

This is an installation/build-time supply-chain exposure. The application does
not expose a tar-upload endpoint, so it must not be misrepresented as a direct
runtime archive-upload vulnerability. Exploitation requires a malicious or
compromised archive entering the native dependency installation path.

#### Source evidence

- [`server/package.json`](../server/package.json#L15) depends on bcrypt `^5.1.1`.
- `package-lock.json` resolves `@mapbox/node-pre-gyp 1.0.11` and `tar 6.2.1`.
- `npm audit --json` reported the vulnerable chain on 19 July 2026.

#### Safe reproduction

Do not execute a malicious archive on the host. Evidence should consist of the
dependency graph, lockfile versions, advisory applicability, and `npm audit`
output in an isolated assessment environment.

#### Impact

A compromised installation artifact could write outside its intended
directory, overwrite files, or disclose local data during dependency
installation.

#### Recommended remediation

Upgrade bcrypt to a release that removes the vulnerable chain, regenerate the
lockfile, use reproducible clean builds, pin CI runtime versions, and add
dependency auditing to CI.

#### Retest criteria

A clean install and `npm audit` must show that the vulnerable tar chain has
been removed. Backend password hashing must still function after the major
upgrade.

---

### LS-007: Login CSRF Can Force an Attacker-Controlled Session

**Category:** CWE-352, Cross-Site Request Forgery  
**OWASP:** A01:2021 Broken Access Control  
**Severity:** Medium  
**CVSS:** 6.5 (`AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:L/A:N`)

#### Technical explanation

State-changing routes do not use CSRF tokens or Origin/Referer validation.
`SameSite=Lax` provides meaningful protection for existing authenticated
cookies on cross-site POST requests, so normal authenticated CSRF is partially
mitigated. It does not fully address login CSRF: a malicious site can submit
attacker-controlled credentials to the login endpoint and attempt to place the
victim browser into the attacker's LexSecure account.

CORS is not a CSRF defense because HTML forms can send simple cross-origin
requests even when JavaScript cannot read the response. Browser-specific cookie
acceptance must be demonstrated before this finding is used in the final video.

#### Source evidence

- [`session.config.js`](../server/src/config/session.config.js#L10) uses `SameSite=Lax`.
- [`auth.routes.js`](../server/src/routes/auth.routes.js#L17) exposes login without a CSRF check.
- [`app.js`](../server/src/app.js#L28) contains CORS but no CSRF middleware.

#### Safe reproduction

Host a local HTML form on a different origin that submits a controlled test
account to `/api/auth/login`. After submission, visit LexSecure and determine
whether the browser accepted the resulting session cookie. Use only test
accounts.

#### Impact

If successful, a victim may enter appointment or legal information into an
account controlled by the attacker, allowing the attacker to view it later.

#### Recommended remediation

Use synchronizer or signed double-submit CSRF tokens on all state-changing
requests, validate Origin/Referer as defense in depth, and consider
`SameSite=Strict` where compatible.

#### Retest criteria

Cross-origin login and authenticated state-changing requests must fail without
a valid token. Same-origin requests with the correct token must continue to
work.

---

### LS-008: Registration Responses Disclose Registered Emails

**Category:** CWE-204, Observable Response Discrepancy  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Severity:** Medium  
**CVSS:** 5.3 (`AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N`)

#### Technical explanation

Registration returns `409` with `An account with this email already exists`
when an email is registered, while a new email returns `201`. This creates a
reliable account-enumeration oracle. The login endpoint correctly uses a generic
credential message, but registration bypasses that protection.

#### Source evidence

- [`auth.controller.js`](../server/src/controllers/auth.controller.js#L21) checks email existence.
- [`auth.controller.js`](../server/src/controllers/auth.controller.js#L24) returns the explicit duplicate-account error.

#### Safe reproduction

Submit registration once with a controlled registered address and once with a
new controlled address. Compare status codes and messages. Do not test email
addresses belonging to real people.

#### Impact

Attackers can build a list of LexSecure users and use it to improve credential
stuffing, phishing, or targeted legal-services impersonation.

#### Recommended remediation

Return a uniform registration response and continue the ownership process by
email. Add rate limiting and monitoring to registration.

#### Retest criteria

Registered and unregistered addresses must produce indistinguishable public
responses, including similar timing.

---

### LS-009: Duplicate Session Middleware Risks Session Desynchronization

**Category:** CWE-613, Insufficient Session Expiration  
**OWASP:** A07:2021 Identification and Authentication Failures  
**Severity:** Provisionally High  
**CVSS:** 8.1 (`AV:N/AC:H/PR:L/UI:N/S:U/C:H/I:H/A:H`)

#### Technical explanation

The Express application registers `express-session` twice with the same cookie
name, secret, and MongoDB store. Each middleware can independently load a
session and register response-completion behavior. Routes operate on the second
`req.session`, while the first middleware may retain a different in-memory
session view.

This creates a risk of competing store touches, cookie writes, regeneration,
or destruction behavior. Security-sensitive operations such as login session
regeneration and logout invalidation must have one authoritative session
middleware. Dynamic testing is required to establish whether the current
middleware and store versions allow a stale session to remain usable.

#### Source evidence

- [`app.js`](../server/src/app.js#L36) registers the first session middleware.
- [`app.js`](../server/src/app.js#L42) registers the same middleware a second time.
- [`session.config.js`](../server/src/config/session.config.js#L12) creates a new store-backed configuration for every call.

#### Safe reproduction

1. Log in with a controlled account and record the issued session identifier.
2. Send concurrent authenticated requests while logging out in another request.
3. Replay the pre-logout identifier against `/api/auth/me`.
4. Repeat around login regeneration while recording all `Set-Cookie` headers
   and session records.
5. Treat the finding as fully confirmed only if a stale identifier remains
   usable or inconsistent cookie/store state is demonstrated.

#### Impact

If stale session state survives regeneration or logout, an attacker holding an
older session identifier may retain access after the user believes the session
has been invalidated. Competing session writes may also cause intermittent
authentication failures.

#### Recommended remediation

Register `express-session` exactly once before authenticated routes. Use one
store instance, add an automated logout-invalidation regression test, and
inspect the sessions collection while testing concurrent requests.

#### Retest criteria

Only one session middleware may be registered. Old identifiers must fail after
login regeneration and logout, including under concurrent requests.

## 4. Validated Non-Findings

The following were reviewed and must not be reported as vulnerabilities without
new evidence:

- **Permissive CORS:** not present. The API compares the Origin header against
  an explicit configured allowlist and enables credentials only for allowed
  origins.
- **Stored or reflected XSS:** not currently demonstrated. React renders
  profile, appointment, and notification text using escaped text nodes, and no
  `dangerouslySetInnerHTML` or direct `innerHTML` sink was found.
- **Basic appointment IDOR:** not demonstrated. Appointment mutations and lists
  include the authenticated client or lawyer identifier in database queries.
- **Session fixation:** mitigated by regenerating the session identifier after
  successful password verification.
- **Default session secret:** not present in the active environment. The secret
  is longer than 32 characters and differs from `.env.example`.
- **Stored admin bootstrap password:** not present in the active environment.

## 5. Attack Chains

### Chain A: Administrator or Lawyer Account Takeover

1. Enumerate likely registered emails through LS-008.
2. Perform credential stuffing without throttling through LS-001.
3. Bypass any second-factor barrier because MFA is absent in LS-002.
4. Access role-protected data and workflows as the compromised user.

### Chain B: Lawyer Schedule Denial of Service

1. Register many unverified accounts using LS-003.
2. Submit pending appointments for distinct lawyer slots through LS-004.
3. Continue without registration or booking rate limits from LS-001's broader
   missing abuse controls.
4. Prevent legitimate clients from reserving those slots.

### Chain C: Developer Environment Secret Exposure

1. Reach the vulnerable local Vite development server in LS-005.
2. Use the applicable advisory path bypass to request a harmless proof file.
3. Demonstrate the possibility of reading project or environment files without
   accessing real secrets.

## 6. Security Testing and Remediation Roadmap

### Phase 1: Preserve the Vulnerable Baseline

1. Commit this report without changing application behavior.
2. Tag the current baseline, for example `security-baseline-sprint3`.
3. Record commit hash, Node version, browser version, MongoDB version, and test
   account roles.
4. Use only synthetic accounts and data.

### Phase 2: Capture Reproducible Evidence

1. Reproduce LS-001, LS-003, LS-004, and LS-008 manually through Burp Suite.
2. Validate LS-007 in each target browser before treating it as confirmed.
3. Record `npm audit` evidence for LS-005 and LS-006.
4. Capture the request, response, application state, and database effect for
   every finding.
5. Avoid high-volume traffic; prove missing limits with the minimum requests.

### Phase 3: Expand Coverage

1. Authentication: sessions, lockout, MFA, password reset, and enumeration.
2. Authorization: client, lawyer, and administrator endpoint matrices.
3. Business logic: booking races, stale transitions, cancellation,
   rescheduling, notification ownership, and slot release.
4. Input handling: stored/reflected XSS, NoSQL injection, mass assignment, and
   HTTP parameter pollution.
5. Browser security: CSRF, CORS, CSP, clickjacking, and cookie attributes.
6. Session security: regeneration, logout invalidation, concurrent requests,
   cookie rotation, and store consistency.
7. API security: unsupported methods, content types, body limits, pagination,
   and error leakage.
8. Supply chain: `npm audit`, lockfile review, CI dependency scanning, and
   container image scanning.

### Phase 4: Fix in Risk Order

1. LS-009 single authoritative session middleware and invalidation retest.
2. LS-001 authentication throttling and lockout.
3. LS-002 TOTP MFA, starting with administrators and lawyers.
4. LS-003 email verification and account recovery.
5. LS-004 booking quotas, pending expiry, and abuse monitoring.
6. LS-005 and LS-006 dependency upgrades.
7. LS-007 comprehensive CSRF protection.
8. LS-008 uniform account responses.

Use one meaningful commit per control so the Git history demonstrates
incremental security improvement.

### Phase 5: Retest and Close

1. Repeat the exact original proof of concept after each fix.
2. Record expected blocked behavior and confirm legitimate workflows still work.
3. Test bypass variants, including alternate encodings, parallel requests,
   different roles, and session renewal.
4. Mark a finding closed only when evidence includes the fix commit, before/after
   request results, and regression outcome.
5. Preserve at least two clear before-and-after scenarios for the compulsory
   video demonstration.

## 7. Intentional Vulnerability Policy

No intentional bug should be added to the main `Sprint3` branch. The current
application already provides enough genuine findings for internal penetration
testing.

If a controlled demonstration of a specific category such as stored XSS or
CORS misconfiguration is academically required later:

1. Create a separate branch such as `lab/intentionally-vulnerable`.
2. Use synthetic data and bind services to localhost.
3. Label every deliberate weakness in a lab manifest.
4. Never merge that branch into the secure application or deploy it publicly.
5. Demonstrate the vulnerability, return to the secure branch, and show the
   remediation and retest.

This approach preserves ethical testing boundaries and avoids presenting
deliberately insecure code as the production design.
