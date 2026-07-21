# LexSecure Sprint 2 Retrospective Audit

## 1. Sprint Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 2 - Lawyer Profiles and Appointment Management |
| Goal | Deliver the secure lawyer discovery and consultation-booking workflow |
| Functional status | Complete |
| Security status | Partially complete; dynamic security testing and fixes remain |
| Audit type | Retrospective white-box review |
| Evidence baseline | Commits `3a28c72` through `c536218` |

Sprint 2 delivered the main LexSecure business workflow. Lawyers create
professional profiles and recurring availability; administrators review those
profiles; clients discover approved lawyers and request consultations; and both
participants manage appointment decisions, cancellation, rescheduling, history,
and notifications.

## 2. Delivered Functionality

### Lawyer and Administrator Workflow

- Lawyer profile and weekly-availability model.
- Secure lawyer-owned profile creation and updates.
- Profile edits return approved profiles to the pending review state.
- Administrator-only profile approval and rejection.
- Administrator bootstrap workflow without public admin registration.
- Approved and visible lawyer directory and profile views.

### Appointment Workflow

- Appointment model linking client, lawyer, and approved lawyer profile.
- Exact recurring-availability validation.
- Timezone-aware conversion from lawyer-local slots to UTC.
- Client appointment request backend and modern booking interface.
- Lawyer pending-request inbox.
- Approve and reject transitions.
- Role-aware client and lawyer appointment dashboards.
- Client/lawyer cancellation with recorded reason and slot release.
- Client rescheduling that returns approved appointments to pending.
- Upcoming, history, status, participant-name, and date filtering.
- Server-side pagination.

### Notifications

- Appointment notification model and REST API.
- Booking, approval, rejection, cancellation, and rescheduling notifications.
- Recipient-scoped unread count and mark-as-read operations.
- Notification panel across authenticated client and lawyer screens.

## 3. API Surface

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `GET` | `/api/lawyer-profiles` | List approved visible lawyers | Public |
| `GET` | `/api/lawyer-profiles/:profileId` | View approved profile | Public |
| `GET` | `/api/lawyer-profiles/me` | View own lawyer profile | Lawyer |
| `POST` | `/api/lawyer-profiles` | Create own profile | Lawyer |
| `PATCH` | `/api/lawyer-profiles/me` | Update own profile | Lawyer |
| `GET` | `/api/admin/lawyer-profiles` | Review queue | Administrator |
| `PATCH` | `/api/admin/lawyer-profiles/:profileId/review` | Approve/reject profile | Administrator |
| `POST` | `/api/appointments` | Request appointment | Client |
| `GET` | `/api/appointments/lawyer` | Pending lawyer requests | Lawyer |
| `GET` | `/api/appointments/me` | Role-scoped dashboard/history | Client or lawyer |
| `PATCH` | `/api/appointments/:appointmentId/decision` | Approve/reject | Assigned lawyer |
| `PATCH` | `/api/appointments/:appointmentId/cancel` | Cancel appointment | Assigned participant |
| `PATCH` | `/api/appointments/:appointmentId/reschedule` | Request new time | Assigned client |
| `GET` | `/api/notifications` | List own notifications | Client or lawyer |
| `GET` | `/api/notifications/unread-count` | Count own unread notifications | Client or lawyer |
| `PATCH` | `/api/notifications/:notificationId/read` | Mark own notification read | Recipient |

## 4. Security Controls Implemented

| Control | Implementation | Security benefit |
| --- | --- | --- |
| Profile ownership | Lawyer ID comes from the authenticated session | Prevents profile IDOR and mass assignment |
| Admin approval | Server-side administrator RBAC | Prevents lawyer self-approval |
| Approval reset | Lawyer edits hide profile and return it to review | Prevents unreviewed public changes |
| Public filtering | Only approved, visible, active lawyers returned | Prevents disclosure of rejected/draft profiles |
| Exact slot matching | Requested date/time must match stored availability | Prevents arbitrary schedule creation |
| Trusted timezone | Timezone read from approved profile | Prevents client-controlled time interpretation |
| Atomic reservation | Unique multikey indexes for client and lawyer blocks | Reduces double-booking races |
| Role-scoped queries | Client/lawyer IDs included in update filters | Prevents appointment IDOR |
| Status allowlists | Explicit pending/approved/cancelled transitions | Prevents unsupported state changes |
| Past-date checks | Past appointments cannot be approved, cancelled, or rescheduled | Protects consultation history |
| Terminal invariants | Rejected/cancelled/completed states release reservations | Prevents stale blocked slots |
| Safe response builders | Confidential/internal fields explicitly mapped | Reduces accidental disclosure |
| Query allowlists | Unsupported filters rejected | Reduces parameter pollution and unexpected queries |
| Escaped search | Participant search regex metacharacters escaped | Reduces regex injection |
| Notification ownership | Recipient included in read/list queries | Prevents notification IDOR |
| Idempotent events | Unique notification event key | Reduces duplicate alerts |
| Confidential notifications | Generic messages exclude legal summaries | Prevents sensitive preview leakage |

## 5. Commit Evidence

| Commit | Evidence |
| --- | --- |
| `3a28c72` | Lawyer profile and recurring availability model |
| `8caae90` | Lawyer profile management |
| `ca93edd` | Admin approval workflow and bootstrap |
| `9104938` | Profile approval interface |
| `80f61cf` | Approved lawyer discovery |
| `067516f` | Appointment model |
| `2d01994` | Secure booking API and interface |
| `3c81a14` | Lawyer appointment decision workflow |
| `717aa3a` | Client/lawyer appointment dashboards |
| `ad2a5a6` | Appointment cancellation |
| `bc0ee3b` | Appointment rescheduling |
| `4e26dd3` | History search and filters |
| `c536218` | Notifications and appointment hardening |

## 6. Audit Findings and Known Gaps

| ID | Gap | Severity | Sprint relationship |
| --- | --- | --- | --- |
| LS-004 | Pending appointments can be abused to exhaust lawyer availability | High | Sprint 2 business-logic weakness |
| LS-007 | Appointment mutations rely on cookie authentication without comprehensive CSRF tokens | Medium | Cross-sprint browser security gap |
| LS-009 | Duplicate session middleware may create competing session state | Provisionally High | Regression introduced during Sprint 2 |

Additional risks requiring dynamic verification:

- Concurrent booking and rescheduling must be tested with parallel requests to
  confirm unique-index behavior under load.
- Every appointment endpoint requires an IDOR matrix using unrelated client and
  lawyer accounts.
- Cancellation and rejection must be verified to release every reserved
  15-minute block.
- DST gaps, DST overlaps, timezone boundaries, leap days, and one-year booking
  limits require manual boundary testing.
- Notification creation is intentionally non-blocking; delivery failure can
  leave a completed appointment action without a matching notification.
- Notification pagination and unread-count consistency require concurrent
  mark-as-read testing.
- Pending appointments do not currently expire automatically.
- No appointment completion endpoint or consultation-note workflow exists yet.
- No audit log records profile approvals or appointment transitions.

## 7. Testing Evidence Still Required

1. Attempt every client endpoint using another client's appointment ID.
2. Attempt lawyer decisions using appointments assigned to another lawyer.
3. Attempt administrator review using client and lawyer sessions.
4. Submit unsupported body fields and query parameters.
5. Race two clients for one lawyer slot.
6. Race one client across overlapping appointments with different lawyers.
7. Race cancellation against approval and rescheduling.
8. Verify rejected and cancelled appointments make slots available again.
9. Test exact start/end boundaries, DST changes, and timezone conversion.
10. Search using regex metacharacters and long valid input.
11. Attempt to read and update another user's notification.
12. Confirm notification content never contains the legal issue summary.
13. Demonstrate LS-004 using a small number of controlled pending bookings.
14. Dynamically investigate LS-009 using concurrent login/logout requests.

## 8. Evidence to Capture for the Coursework

- Screenshots of lawyer profile creation and administrator approval.
- Before/after evidence showing profile edits return approval to pending.
- Burp request showing a client cannot approve an appointment.
- Burp request showing one lawyer cannot access another lawyer's request.
- MongoDB index evidence for client and lawyer reservation blocks.
- Parallel booking responses demonstrating one success and one `409`.
- Cancellation/rescheduling evidence showing slot release and status transition.
- Notification recipient IDOR attempt and blocked response.
- Appointment history filters and safe pagination.
- Git commit mapping from profile model through notification hardening.

## 9. Sprint Assessment

Sprint 2 is **functionally complete**. The end-to-end profile approval,
discovery, booking, decision, cancellation, rescheduling, dashboard, history,
and notification workflows are present.

Sprint 2 is **not security closed** until LS-004 and LS-009 are remediated and
the IDOR, concurrency, timezone, state-transition, notification, and CSRF test
matrices have been executed with evidence.

## 10. Report-Ready Summary

Sprint 2 implemented LexSecure's core lawyer-discovery and appointment
management workflow. Secure-by-design controls include administrator approval,
session-derived ownership, server-enforced RBAC, exact availability matching,
trusted timezone conversion, atomic reservation indexes, controlled state
transitions, safe response mapping, and recipient-scoped notifications. The
retrospective audit found no obvious basic appointment IDOR in source review,
but formal multi-role and concurrency testing remains necessary. The main
business-logic risk is malicious exhaustion of pending appointment slots, while
duplicate session middleware is a cross-cutting authentication regression that
requires urgent dynamic validation and remediation.
