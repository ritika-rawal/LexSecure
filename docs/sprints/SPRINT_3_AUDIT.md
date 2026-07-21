# LexSecure Sprint 3 In-Progress Security Audit

## 1. Sprint Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 3 - Documents, Communication, and Administration |
| Goal | Deliver secure collaboration between clients and lawyers |
| Functional status | In progress |
| Current increment | Secure account and appointment export |
| Security status | Design review complete for this increment; dynamic audit remains |
| Audit type | Continuous white-box review |

Sprint 3 started with the confidential-document workflow. An authenticated
client can upload an approved document type from an active appointment. The
appointment's client and assigned lawyer can list and download those documents
from their role-aware dashboards. Stored files are encrypted and kept outside
the public frontend tree.

The second increment adds encrypted appointment messaging. Only the
appointment's client and assigned lawyer can access its conversation, and new
messages are accepted only after the lawyer approves the appointment. Both
roles use an escaped-text conversation panel inside their appointment
dashboard.

The current increment adds verified consultation reviews. Only the client who
owns a past approved or completed appointment can submit one immutable review.
Public responses identify the author only as a verified client and do not
expose the client or appointment identifiers.

The final functional increment adds an authenticated JSON data export. Clients
receive only their own account and appointments, while lawyers receive their
own account, professional profile, and assigned appointments. The endpoint has
no caller-controlled ownership identifier and excludes document contents,
messages, authentication secrets, sessions, cryptographic metadata, and audit
records.

This report is intentionally marked in progress. Security hardening and dynamic
security evidence are not yet complete.

## 2. Delivered Functionality

- Private, server-controlled legal-document storage directory.
- Document metadata model linked to an appointment and uploader.
- Client-only upload to an owned pending or approved appointment.
- Participant-only document listing and download.
- PDF, DOCX, TXT, JPEG, and PNG allowlist.
- Five-megabyte file-size limit.
- Declared MIME type, filename extension, and content-signature validation.
- AES-256-GCM encryption with a fresh random IV for every file.
- SHA-256 plaintext integrity verification after decryption.
- Opaque UUID storage names that do not use user-supplied paths.
- Safe response mapping that excludes storage names, hashes, IVs, and tags.
- Paginated document metadata listing.
- Attachment downloads with browser caching disabled.
- Lazy-loaded document panels in client and lawyer appointment dashboards.
- Client-side filename, type, empty-file, and five-megabyte validation.
- Upload progress with accessible success and failure feedback.
- Authenticated browser downloads using temporary object URLs.
- Document empty, loading, retry, pagination, and download states.
- Immutable appointment-message model with server-derived recipients.
- Participant-only message creation and history access.
- Approved-appointment requirement for sending new messages.
- AES-256-GCM message encryption using a separate application key.
- Authenticated encryption context binds ciphertext to the appointment,
  sender, and recipient.
- Strict message-body, identifier, query-field, and pagination validation.
- Paginated newest-first message history with private, non-cacheable responses.
- Safe response mapping that excludes ciphertext, IVs, tags, and recipient
  storage metadata.
- Endpoint-level authorization on shared `/api` routers to prevent unrelated
  API requests being intercepted.
- Lazy-loaded messaging panels in client and lawyer appointment dashboards.
- Chronological conversation display with newest-first API pagination.
- Role-aware message alignment without trusting sender details from the client.
- Unicode-aware 2,000-character composer validation.
- Explicit loading, empty, retry, refresh, sending, and unavailable states.
- React text-node rendering with no HTML interpretation sink.
- Generic recipient-only notification for each successfully stored message.
- Message notifications exclude body text, legal context, and participant
  names.
- Message-ID-based notification event keys prevent duplicate alerts.
- Visible-page unread-count refresh every 30 seconds.
- Server-generated UUID request correlation on API responses and audit events.
- Application-enforced append-only audit collection with no update or delete
  service.
- HMAC-SHA-256 integrity value over every canonical audit event.
- Keyed source fingerprints instead of stored raw IP addresses or user-agent
  strings.
- Keyed failed-login subject correlation instead of stored email addresses.
- Audit coverage for registration, successful and failed login, logout, lawyer
  profile changes and review, appointment transitions, document access, and
  message sending.
- Audit metadata excludes passwords, session identifiers, legal summaries,
  cancellation reasons, filenames, document bytes, and message bodies.
- Administrator-only read API for audit events.
- Strict audit filter allowlist covering action, outcome, actor role, target
  type, request ID, target ID, date range, and pagination.
- Integrity verification before actor display data is populated.
- Safe audit responses with shortened source and subject references.
- Read-only operational table with filtering, pagination, refresh, and
  responsive horizontal overflow.
- Prominent failed-integrity state instead of hiding malformed records.
- Every successful audit-log view creates its own audit event.
- One immutable review per eligible appointment.
- Integer ratings restricted to the range one to five.
- Optional review comments restricted to 10-1,000 characters.
- Client ownership and appointment eligibility verified on the server.
- Database uniqueness enforcement for concurrent duplicate submissions.
- Public review summaries with bounded pagination.
- Public reviewer identity minimized to `Verified client`.
- Public review responses exclude client and appointment identifiers.
- Private review-status and submission responses disable browser caching.
- React text-node rendering for review comments with no HTML interpretation
  sink.
- Review creation is recorded without storing comment text in the audit log.
- Authenticated self-service JSON export for client and lawyer accounts.
- Server-derived account and appointment ownership with no user-ID parameter.
- Explicit safe mapping for account, lawyer-profile, and appointment fields.
- Fixed generic attachment filename and JSON content type.
- Private, non-cacheable export responses.
- Appointment-count and serialized-size bounds for immediate exports.
- Export audit events that contain no exported profile or appointment content.
- Account-page download control with blob-safe error handling.
- Temporary browser object URLs revoked immediately after download initiation.

## 3. API Surface

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/appointments/:appointmentId/documents` | Upload one document | Owning client |
| `GET` | `/api/appointments/:appointmentId/documents` | List appointment documents | Assigned client or lawyer |
| `GET` | `/api/documents/:documentId/download` | Download and decrypt a document | Assigned client or lawyer |
| `POST` | `/api/appointments/:appointmentId/messages` | Send one message | Assigned client or lawyer; approved appointment |
| `GET` | `/api/appointments/:appointmentId/messages` | List message history | Assigned client or lawyer |
| `GET` | `/api/appointments/:appointmentId/review` | Read review status or the submitted review | Owning client |
| `POST` | `/api/appointments/:appointmentId/review` | Submit one consultation review | Owning client; past approved/completed appointment |
| `GET` | `/api/lawyer-profiles/:profileId/reviews` | List verified reviews and rating summary | Public |
| `GET` | `/api/account/export` | Download safe account/profile/appointment JSON | Authenticated client or lawyer |

The upload request uses `multipart/form-data` with exactly one file in the
`document` field and no additional form fields.

## 4. Security Controls Implemented

| Control | Implementation | Security benefit |
| --- | --- | --- |
| Server-derived ownership | Uploader identity comes from the session | Prevents upload impersonation and mass assignment |
| Appointment authorization | Database queries include client or lawyer ID | Reduces document IDOR risk |
| State restriction | Uploads require pending or approved appointments | Prevents attaching files to rejected, cancelled, or completed records |
| Route-scoped parser | Multer runs only on the upload endpoint | Reduces multipart attack surface |
| Memory and count limits | One file, one part, no fields, maximum 5 MB | Bounds request memory consumption |
| Type allowlist | Extension, declared MIME, and detected content must agree | Rejects common renamed-file bypasses |
| Filename validation | Paths, control characters, and multiple extensions rejected | Reduces path and response-header abuse |
| Opaque storage names | Random UUID names with a fixed `.bin` suffix | Prevents user-controlled filesystem paths and name collisions |
| Private storage | Files are outside static/public directories and ignored by Git | Prevents direct URL access and accidental source-control disclosure |
| At-rest encryption | AES-256-GCM with a fresh 96-bit IV | Protects confidentiality and detects ciphertext alteration |
| Restricted file mode | New encrypted files request owner-only permissions | Reduces local-user access where the operating system supports modes |
| Metadata minimization | Storage and cryptographic fields use `select: false` | Reduces accidental API disclosure |
| Safe downloads | Authorization precedes file read and decryption | Prevents unauthorized filesystem access |
| Cache prevention | `Cache-Control: private, no-store` | Reduces confidential document persistence in browser caches |
| Controlled failures | Missing files, storage faults, and integrity failures are separated | Avoids falsely reporting internal faults as ordinary missing records |
| Server-derived recipient | Recipient comes from the appointment participant pair | Prevents arbitrary-user messaging and recipient mass assignment |
| Approved conversation | Send queries require approved appointment status | Prevents unsolicited messaging through pending or rejected requests |
| Message encryption | Separate AES-256-GCM key and random IV | Protects confidential message bodies at rest |
| Metadata authentication | Appointment, sender, and recipient are GCM additional data | Detects ciphertext reassignment between conversations |
| Immutable records | No update or delete endpoint and immutable schema fields | Preserves conversation history and reduces tampering paths |
| Message minimization | Ciphertext, IV, tag, and recipient are not returned | Reduces sensitive metadata disclosure |
| Body allowlist | Only the `message` property is accepted | Prevents message mass assignment |
| Control-character checks | Unsafe C0 controls are rejected while line breaks remain allowed | Reduces parser and display ambiguity |
| Conversation no-store | Message responses disable browser caching | Reduces confidential history persistence in shared caches |
| Generic authorization failure | Non-participants receive conversation not found | Reduces appointment and conversation enumeration |
| Confidential alerts | Notification content contains no message preview or sender identity | Reduces disclosure through notification surfaces |
| Recipient-scoped alerts | Recipient comes from the authorized appointment pair | Prevents attacker-selected notification targets |
| Idempotent message events | Message ID forms part of the unique notification key | Prevents duplicate alerts for one stored message |
| Non-blocking alert delivery | Notification failure does not change message-send success | Prevents misleading retries and duplicate messages |
| Server request IDs | A new UUID is generated instead of trusting request headers | Reduces log injection and correlation collisions |
| Append-only model boundary | Save updates, query mutations, document deletion, batch insert, and bulk writes are rejected | Reduces accidental or application-level log alteration |
| Event integrity HMAC | Canonical event fields are signed with a separate key | Detects direct modification of protected fields |
| Pseudonymous source correlation | IP and user-agent are represented by a keyed digest | Supports correlation without storing raw source data |
| Pseudonymous login correlation | Failed-login email is represented by a keyed digest | Supports attack analysis without storing attempted addresses |
| Explicit event allowlist | Actions, outcomes, actor roles, and target types use enums | Prevents arbitrary log content and log injection |
| Payload minimization | Only IDs, roles, actions, outcomes, hashes, and timestamps are recorded | Prevents confidential legal content entering audit logs |
| Post-commit non-blocking writes | Audit failure cannot make a committed mutation appear unsuccessful | Reduces duplicate business operations caused by retries |
| Administrator-only listing | Session authentication and server-side admin RBAC protect the endpoint | Prevents clients and lawyers reading security telemetry |
| Read-only API | Only `GET` is exposed and model mutation guards remain active | Reduces audit tampering surface |
| Filter allowlist | Unknown query parameters and invalid enum/ID/date values are rejected | Reduces query injection and unbounded filtering |
| Pre-population verification | HMAC is checked while actor remains the original stored identifier | Avoids display joins changing canonical integrity data |
| Failure-visible response | Malformed or altered records return failed integrity status | Prevents silent trust in corrupted events |
| Hash minimization | Only 12-character correlation references reach the browser | Limits disclosure of pseudonymous tracking values |
| No-store audit responses | Administrator results disable browser caching | Reduces security telemetry persistence on shared devices |
| Audited reads | Each successful audit-log listing records `audit.logs_viewed` | Creates accountability for access to security records |
| Server-derived reviewer | Client identity comes from the authenticated session and owned appointment | Prevents reviewer impersonation and mass assignment |
| Server-derived lawyer | Lawyer and profile references come from the appointment | Prevents posting a review against an attacker-selected lawyer |
| Consultation eligibility | Status and end time are checked against server data | Prevents reviews for pending, rejected, cancelled, or future consultations |
| One review per appointment | Immutable reference plus a unique database index | Limits review fraud and closes concurrent duplicate submissions |
| Strict review input | Exact body allowlist, integer rating, bounded comment, and control-character rejection | Reduces mass assignment, parser ambiguity, and unbounded stored content |
| Public identity minimization | Reviewer is labelled generically and client/appointment IDs are omitted | Reduces personal-data disclosure and appointment correlation |
| Approved profile check | Public listing reuses the approved, active lawyer-profile boundary | Prevents reviews exposing hidden or inactive profiles |
| Escaped review rendering | React renders comment values as text nodes | Reduces stored-XSS risk in the intended frontend |
| Immutable review history | No update or delete route is exposed and schema fields are immutable | Preserves evidential consistency and limits post-publication tampering |
| Review audit minimization | Creation event contains review ID but no rating or comment | Provides accountability without copying user content into security logs |
| Session-derived export scope | Account ID and role come only from the authenticated session | Removes an IDOR selector and prevents exporting another account |
| Role-scoped appointment query | Client exports query `client`; lawyer exports query `lawyer` | Restricts records to consultations in which the requester participated |
| Explicit export mapper | Only allowlisted account, profile, participant, schedule, status, and consultation fields are serialized | Prevents password, session, cryptographic, and internal metadata disclosure |
| No related-content expansion | Documents, messages, reviews, notifications, and audit records are not queried | Limits the sensitivity and blast radius of a downloaded file |
| Strict empty request | Query parameters and request-body fields are rejected | Prevents unsupported filtering and future mass-assignment ambiguity |
| Bounded generation | Appointment count is capped at 5,000 and output at 10 MB | Reduces memory-exhaustion risk from synchronous export generation |
| Attachment response | Fixed generic filename and JSON media type are server controlled | Reduces response-header injection and accidental browser rendering |
| Export no-store | `Cache-Control: private, no-store` is set | Reduces persistence in shared browser and intermediary caches |
| Audited export | Successful generation records account export against the requester | Creates accountability without logging exported content |

## 5. Files Added or Modified in This Increment

| File | Purpose |
| --- | --- |
| `server/src/constants/document.js` | Central file types and maximum upload size |
| `server/src/models/Document.model.js` | Document ownership, metadata, and cryptographic metadata schema |
| `server/src/utils/document-file.js` | Filename, MIME, extension, signature, and UTF-8 validation |
| `server/src/utils/document-crypto.js` | Authenticated encryption, decryption, and integrity verification |
| `server/src/utils/safe-document.js` | Explicit safe API response mapping |
| `server/src/middleware/document-upload.middleware.js` | Bounded, route-scoped multipart parsing |
| `server/src/validators/document.validator.js` | Identifier and pagination validation |
| `server/src/services/document.service.js` | Authorization, private storage, encryption, and cleanup |
| `server/src/controllers/document.controller.js` | REST response and secure-download handling |
| `server/src/routes/document.routes.js` | Document endpoint and role composition |
| `server/src/config/app.config.js` | Strict encryption-key loading |
| `server/src/app.js` | Document route registration |
| `server/storage/documents/.gitkeep` | Tracks the empty private-storage directory only |
| `server/.env.example` | Documents the required encryption-key variable |
| `.gitignore` | Excludes uploaded ciphertext while allowing audit documents |
| `server/package.json` and `package-lock.json` | Add Multer and file-signature detection dependencies |
| `client/src/features/documents/constants/document.js` | Shared client-side file constraints and pagination size |
| `client/src/features/documents/utils/document.js` | File validation and metadata formatting |
| `client/src/features/documents/api/document.api.js` | Credentialed upload, list, and blob-download requests |
| `client/src/features/documents/components/AppointmentDocuments.jsx` | Role-aware upload, list, pagination, and download interface |
| `client/src/features/appointments/components/DashboardAppointmentItem.jsx` | Integrates documents into each participant's appointment view |
| `server/src/constants/message.js` | Message and pagination boundaries |
| `server/src/models/Message.model.js` | Immutable encrypted-message metadata schema |
| `server/src/utils/message-crypto.js` | Context-bound authenticated message encryption |
| `server/src/utils/safe-message.js` | Explicit decrypted-message API response mapping |
| `server/src/validators/message.validator.js` | Message, identifier, body-field, and query validation |
| `server/src/services/message.service.js` | Conversation authorization, recipient derivation, encryption, and pagination |
| `server/src/controllers/message.controller.js` | Non-cacheable REST responses |
| `server/src/routes/message.routes.js` | Participant-only message endpoints |
| `server/src/routes/document.routes.js` | Moves authorization to matching endpoints to isolate shared router paths |
| `server/src/config/app.config.js` | Strict separate message-key loading |
| `server/.env.example` | Documents the required message-encryption key |
| `client/src/features/messages/constants/message.js` | Shared composer and pagination limits |
| `client/src/features/messages/api/message.api.js` | Credentialed message history and send requests |
| `client/src/features/messages/utils/message.js` | Unicode-aware validation and date formatting |
| `client/src/features/messages/components/AppointmentMessages.jsx` | Role-aware escaped-text conversation interface |
| `client/src/features/appointments/components/DashboardAppointmentItem.jsx` | Integrates messaging into each appointment view |
| `server/src/constants/notification.js` | Adds the secure-message notification type |
| `server/src/services/notification.service.js` | Defines generic confidential-safe message alert content |
| `server/src/services/message.service.js` | Records an idempotent recipient alert after message storage |
| `client/src/features/notifications/components/NotificationBell.jsx` | Maps message alerts and refreshes unread counts while visible |
| `server/src/constants/audit.js` | Allowlists audit roles, actions, outcomes, and target types |
| `server/src/middleware/audit-context.middleware.js` | Generates trusted request IDs and response correlation headers |
| `server/src/models/AuditLog.model.js` | Immutable event schema, indexes, and application-level mutation guards |
| `server/src/utils/audit-integrity.js` | Source/subject HMACs and event integrity creation/verification |
| `server/src/services/audit.service.js` | Central append and non-blocking recording services |
| `server/src/controllers/auth.controller.js` | Records registration, login success/failure, and logout |
| `server/src/controllers/lawyer-profile.controller.js` | Records profile creation and updates |
| `server/src/controllers/admin-lawyer-profile.controller.js` | Records administrator approval and rejection |
| `server/src/controllers/appointment.controller.js` | Records booking and appointment state changes |
| `server/src/controllers/document.controller.js` | Records document upload and authorized download |
| `server/src/controllers/message.controller.js` | Records successful message creation without content |
| `server/src/config/app.config.js` | Strictly loads the separate audit HMAC key |
| `server/src/app.js` | Registers audit request context before API routes |
| `server/.env.example` | Documents the required audit HMAC key |
| `server/src/utils/safe-audit-log.js` | Maps verified events to minimized administrator responses |
| `server/src/services/admin-audit.service.js` | Applies filters, verifies integrity, populates actors, and paginates |
| `server/src/validators/admin-audit.validator.js` | Allowlists and validates every audit query field |
| `server/src/controllers/admin-audit.controller.js` | Returns non-cacheable logs and records audited reads |
| `server/src/routes/admin-audit.routes.js` | Exposes the administrator-only read endpoint |
| `server/src/constants/audit.js` | Adds audit-view action and audit-log target type |
| `client/src/features/admin/constants/auditLog.js` | Mirrors supported filter options and page size |
| `client/src/features/admin/api/auditLog.api.js` | Sends credentialed, normalized audit-list requests |
| `client/src/features/admin/utils/auditLog.js` | Formats allowlisted labels and timestamps |
| `client/src/features/admin/components/AuditLogFilters.jsx` | Provides explicit operational filters |
| `client/src/features/admin/pages/AuditLogPage.jsx` | Read-only table, integrity status, pagination, and error states |
| `client/src/features/admin/pages/LawyerReviewPage.jsx` | Adds navigation to security audit logs |
| `client/src/routes/AppRoutes.jsx` | Registers the admin-protected audit-log page |
| `server/src/constants/review.js` | Central rating, comment, and pagination limits |
| `server/src/models/Review.model.js` | Immutable, appointment-unique review schema and indexes |
| `server/src/utils/safe-review.js` | Separate private and public response mappings |
| `server/src/validators/review.validator.js` | Exact-field, identifier, rating, comment, and query validation |
| `server/src/services/review.service.js` | Ownership, eligibility, uniqueness, and public aggregation rules |
| `server/src/controllers/review.controller.js` | REST responses, private cache prevention, and review audit event |
| `server/src/routes/review.routes.js` | Client-only submission/status and public listing endpoints |
| `server/src/constants/audit.js` | Adds the allowlisted review creation action and target type |
| `server/src/app.js` | Registers review routes |
| `client/src/features/reviews/constants/review.js` | Mirrors review UI limits and page size |
| `client/src/features/reviews/api/review.api.js` | Review status, submission, and public-list requests |
| `client/src/features/reviews/utils/review.js` | Client-side review validation and date formatting |
| `client/src/features/reviews/components/StarRating.jsx` | Accessible interactive and read-only star control |
| `client/src/features/reviews/components/AppointmentReview.jsx` | Eligible-client review form and immutable submitted state |
| `client/src/features/reviews/components/LawyerReviews.jsx` | Public rating summary, review list, and pagination |
| `client/src/features/appointments/components/DashboardAppointmentItem.jsx` | Shows review controls after an eligible client consultation |
| `client/src/features/lawyers/pages/PublicLawyerProfilePage.jsx` | Displays verified public reviews on a lawyer profile |
| `server/src/constants/account-export.js` | Central appointment-count, byte-size, and format-version limits |
| `server/src/utils/safe-account-export.js` | Explicitly maps safe account, profile, and appointment export fields |
| `server/src/services/account-export.service.js` | Applies role ownership, bounds, sorting, and safe export composition |
| `server/src/validators/account-export.validator.js` | Rejects unsupported export query parameters and request bodies |
| `server/src/controllers/account-export.controller.js` | Serializes, size-checks, audits, and sends the protected attachment |
| `server/src/routes/account-export.routes.js` | Exposes the authenticated client/lawyer export endpoint |
| `server/src/constants/audit.js` | Adds the allowlisted account export audit action |
| `server/src/app.js` | Registers account export routes |
| `client/src/features/export/api/accountExport.api.js` | Requests the credentialed export as a browser blob |
| `client/src/features/export/utils/accountExport.js` | Saves the generic JSON file and safely reads blob error responses |
| `client/src/features/export/components/AccountDataExport.jsx` | Provides accessible download, loading, success, and failure states |
| `client/src/features/auth/pages/AccountPage.jsx` | Adds export access to client and lawyer account pages |

## 6. Known Gaps and Audit Targets

| Area | Current status | Required audit or future control |
| --- | --- | --- |
| Malware | No malware scanner is integrated | Scan PDF, Office, and image uploads before release to another user |
| Storage quota | Per-file size is bounded, aggregate storage is not | Add per-user/per-appointment quotas and abuse monitoring |
| CSRF | Cookie-authenticated mutation has no CSRF token | Add and verify comprehensive CSRF protection |
| Rate limiting | Baseline control is not yet implemented | Limit upload frequency and bandwidth independently of login limits |
| Key management | One environment key protects all files | Define production secret storage, rotation, versioning, and recovery |
| Backups | Encrypted-file and metadata backup policy is undefined | Verify synchronized backup and restoration |
| Orphan handling | DB failure removes a newly written file | Audit crash windows and add orphan reconciliation |
| Content inspection | Signature checks do not detect polyglots or active document content | Test malformed, polyglot, macro-enabled, and parser-confusion samples safely |
| Download headers | Secure attachment behavior is implemented | Verify filenames and content types across target browsers |
| Authorization | Source queries are participant-scoped | Execute a full client/lawyer IDOR matrix |
| Concurrency | UUID names prevent collisions | Race uploads and verify metadata/file consistency |
| Audit logging | High-value mutations and document access are logged | Expand coverage as new privileged features are added |
| Retention | Deletion and retention are not implemented | Define legal retention, secure deletion, and authorization rules |
| Messaging UI | React escaped-text interface implemented | Verify XSS payloads remain text in every supported browser |
| Message abuse | Length is bounded but send volume is not | Add message-specific throttling, quotas, and abnormal-volume monitoring |
| Message status | No read receipts or unread state | Add only if required, with recipient-scoped updates |
| Message alerts | Generic no-preview notification implemented | Verify recipient scope, idempotency, and polling behavior |
| Alert consistency | Notification writes are intentionally non-blocking | Add reconciliation for rare message-without-alert failures |
| Audit viewer | Read-only admin API and interface implemented | Verify role matrix, filtering, no-store behavior, and integrity display |
| Audit consistency | Writes occur after primary operations and are non-blocking | Add reconciliation and operational alerting for failed audit writes |
| Deletion detection | Per-record HMAC detects modification, not removed records | Export checkpoints or use immutable external log storage |
| Database privilege | Mongoose guards cannot stop direct privileged database writes | Restrict DB administration and monitor the collection externally |
| Audit key lifecycle | One environment HMAC key signs all current records | Add key identifiers, protected rotation, and historical verification |
| Audit retention | Audit records have no defined retention/archive policy | Define coursework/legal retention and protected disposal |
| Failure coverage | Failed login is recorded; other denied operations are not yet classified | Add carefully allowlisted denial events without logging attacker payloads |
| Audit volume | Failed-login events can grow without baseline throttling | Add rate limiting, capacity monitoring, and protected archival |
| Message key lifecycle | Separate environment key is required | Define rotation, key versioning, backup, and recovery |
| Message retention | Messages are immutable indefinitely | Define retention and legally authorized deletion policy |
| Review moderation | Reviews publish without an administrator moderation/reporting workflow | Define abuse reporting, moderation authority, and evidence retention |
| Review disputes | No no-show, disputed-consultation, or appeal state exists | Define when an otherwise approved past appointment should be ineligible |
| Review lifecycle | Reviews cannot be corrected or withdrawn | Define a privacy-safe correction, withdrawal, and legal-retention policy |
| Lawyer response | Lawyers cannot respond to reviews | Add only if required, with strict ownership and content controls |
| Rating discovery | Lawyer directory does not sort or filter by rating | Add only if required and guard against ranking manipulation |
| Export scale | Immediate generation intentionally rejects accounts above current bounds | Add an authenticated asynchronous export job if large production accounts must be supported |
| Local file handling | The server cannot control the downloaded file after browser delivery | Document shared-device handling and user responsibility for local storage |
| Export retention | Generated data is not stored by LexSecure, but browser/download retention is user controlled | Define user guidance and organizational handling policy |
| Data portability scope | Documents and message contents are deliberately excluded | Confirm the coursework definition of profile and appointment export does not require a full data-subject-access package |

The existing cross-sprint findings in `docs/SECURITY_BUG_REPORT.md`, including
missing abuse controls, CSRF coverage, and duplicate session middleware, remain
open. They have not been silently fixed as part of this feature increment.

## 7. Dynamic Evidence Still Required

1. Upload every allowed type using controlled, harmless sample files.
2. Reject executable, HTML, SVG, macro-enabled Office, renamed, empty, and
   oversized files.
3. Attempt upload to another client's appointment.
4. Attempt upload to rejected, cancelled, and completed appointments.
5. Attempt listing and downloading with an unrelated client and lawyer.
6. Modify a stored ciphertext byte and confirm download fails closed.
7. Modify the database authentication tag and confirm download fails closed.
8. Verify plaintext filenames and content never appear in the storage path.
9. Verify encrypted bytes do not contain a recognizable plaintext sample.
10. Confirm response bodies never expose storage names, hashes, IVs, or tags.
11. Confirm downloads use attachment disposition and are not browser-cached.
12. Interrupt upload/database operations and inspect for orphaned files.
13. Measure memory behavior at the five-megabyte boundary and with parallel
    uploads.
14. Send and list messages as both assigned participants.
15. Attempt message access using unrelated clients and lawyers.
16. Attempt sending against pending, rejected, cancelled, and completed
    appointments.
17. Submit unsupported fields, control characters, empty content, and content
    over 2,000 characters.
18. Move encrypted message metadata between controlled records and confirm
    authenticated decryption fails.
19. Confirm MongoDB and API logs do not contain plaintext message bodies.
20. Render XSS payload strings through the React UI and confirm they remain
    escaped text.
21. Send a message and confirm exactly one recipient notification is created.
22. Confirm the notification never includes message text, sender name, or legal
    summary.
23. Attempt to read and mark the message notification using an unrelated
    account.
24. Retry the same notification event and confirm the unique event key prevents
    duplication.
25. Confirm the unread badge refreshes while the page is visible and stops
    polling after logout or component unmount.
26. Perform every covered mutation and match the response request ID to one
    audit event.
27. Confirm failed-login records contain only keyed correlation values and no
    attempted email or password.
28. Confirm document and message events contain no filename, document content,
    message body, or legal summary.
29. Modify one controlled audit field directly in MongoDB and confirm integrity
    verification reports failure.
30. Attempt every blocked Mongoose update, replacement, delete, insert-many,
    and bulk-write path.
31. Cause a controlled audit-write failure and confirm the primary completed
    operation is not duplicated by the client.
32. Verify request IDs are server generated even when a conflicting request
    header is supplied.
33. Attempt the audit endpoint with anonymous, client, and lawyer sessions and
    confirm each is denied.
34. Submit unsupported query fields, invalid enums, malformed IDs, reversed
    dates, and excessive page sizes.
35. Confirm a directly altered event is returned with failed integrity status
    rather than crashing or disappearing.
36. Confirm full source, subject, and integrity hashes never reach the browser.
37. Confirm each successful administrator listing creates one
    `audit.logs_viewed` event.
38. Verify audit responses include `private, no-store` and that filtering never
    returns records outside the requested range.
39. Submit a review as the owning client after an approved consultation ends.
40. Attempt the same submission as the assigned lawyer, an unrelated client,
    an administrator, and an anonymous user.
41. Attempt reviews for pending, future approved, rejected, and cancelled
    appointments.
42. Send duplicate review requests concurrently and confirm only one record is
    created.
43. Reject ratings outside one to five, fractional ratings, short or oversized
    comments, unsafe controls, and unsupported body/query fields.
44. Confirm the public response contains no client ID, appointment ID, email,
    or account name.
45. Render harmless stored-XSS marker strings and confirm they remain escaped
    text.
46. Recalculate the displayed average from controlled review records and
    confirm pagination does not alter the summary.
47. Confirm review-status and submission responses use `private, no-store`.
48. Confirm the review audit event contains the review ID but no rating or
    comment text.
49. Export as a client and verify every appointment has that account as its
    client in controlled database records.
50. Export as a lawyer and verify every appointment is assigned to that lawyer
    and only the lawyer's own professional profile appears.
51. Attempt export anonymously and as an administrator, and submit unsupported
    query parameters and request-body fields.
52. Confirm password hashes, MFA secrets, session identifiers, lockout fields,
    document/message ciphertext metadata, notifications, and audit records are
    absent.
53. Confirm counterpart email addresses and internal database ownership fields
    are absent while counterpart display names remain available.
54. Verify attachment disposition, generic filename, JSON content type,
    content length, and `private, no-store` headers.
55. Exercise controlled appointment-count and serialized-size boundaries and
    confirm oversized exports fail before attachment headers are sent.
56. Confirm a successful export produces one `account.data_exported` event
    containing the requester ID but no exported content.
57. Inspect browser storage and confirm the application does not retain the
    downloaded blob URL or export data in local/session storage.

Only synthetic legal documents should be used during testing.

## 8. Evidence to Capture for the Coursework

- Burp request and response for an accepted PDF upload.
- Rejected renamed executable and oversized-file responses.
- Before/after storage bytes showing plaintext is encrypted at rest.
- MongoDB metadata screenshot with sensitive fields omitted from API output.
- Client-versus-unrelated-user document IDOR attempts.
- Altered-ciphertext integrity failure.
- Browser download headers showing attachment and `no-store`.
- Burp participant-versus-non-participant messaging authorization matrix.
- MongoDB message record showing encrypted content instead of plaintext.
- Tampered message metadata producing a closed integrity failure.
- Rejected send request for a non-approved appointment.
- Client and lawyer conversation views showing role-aware alignment.
- Harmless XSS marker text visibly rendered without DOM execution.
- Notification database/API evidence showing generic content only.
- Recipient-versus-unrelated-user notification authorization attempt.
- One message record mapped to one notification event.
- API response and audit record showing the same server request ID.
- MongoDB audit event showing pseudonymous source and no confidential payload.
- Before/after controlled audit modification with failed HMAC verification.
- Blocked application-level audit update and delete attempts.
- Event coverage table mapped to each controller and actor role.
- Client/lawyer `403` responses for the administrator audit endpoint.
- Filtered audit table showing action, role, target, date, and outcome filters.
- Administrator view showing a controlled failed-integrity record.
- Browser network evidence showing shortened references and no full hashes.
- Audit event proving administrator access to the audit log was itself logged.
- Git commit containing this backend increment and its audit report.
- Burp role-and-appointment-state matrix for review submission.
- Concurrent duplicate-review requests showing one success and one conflict.
- Public review response showing minimized reviewer and appointment data.
- Browser DOM evidence showing a harmless stored-XSS marker remains text.
- Controlled review records matched to the displayed average rating.
- Review response headers showing `private, no-store`.
- Review creation event showing no copied review content.
- Client and lawyer exports matched against controlled ownership records.
- Anonymous/admin denial and unsupported-input responses for the export route.
- Export file inspection showing allowlisted fields and excluded secrets.
- Download response showing attachment, content type, length, and `no-store`.
- Account export audit event showing no profile or appointment payload.

## 9. Sprint 3 Work Remaining

1. Perform the Sprint 3 security-hardening pass.
2. Execute the dynamic audit matrix and attach evidence.
3. Define or formally accept the review moderation, export scope, and retention
   limitations.
4. Convert this report from in-progress to retrospective complete.

## 10. Current Assessment

The encrypted document, appointment-messaging, audit-monitoring, verified
review, and role-scoped export workflows are functionally implemented but are
not yet security closed.
Their static
design provides bounded parsing, layered file-type checks, participant-scoped
authorization, non-public encrypted storage, context-bound message encryption,
integrity verification, safe response mapping, escaped-text rendering, and
tamper-evident application audit events. Reviews add server-derived ownership,
consultation-state verification, database-backed duplicate prevention, and a
privacy-minimized public response. Exports add session-derived scope, explicit
field allowlisting, bounded generation, protected attachment delivery, and
audited access.

The main remaining risks are malicious document content, aggregate storage
exhaustion, message-volume abuse, missing CSRF and rate-limit controls, key
lifecycle management, retention, audit-write reconciliation, audit deletion
detection, notification reconciliation, and unexecuted multi-role dynamic
testing. Review moderation, dispute handling, and withdrawal policy are also
undefined. Sprint 3 must remain open until those items are either implemented
or formally recorded as accepted project limitations.
