# LexSecure Sprint 3 In-Progress Security Audit

## 1. Sprint Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 3 - Documents, Communication, and Administration |
| Goal | Deliver secure collaboration between clients and lawyers |
| Functional status | In progress |
| Current increment | Encrypted document and messaging workflows |
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

This report is intentionally marked in progress. Message notifications, audit
logging, administration improvements, security hardening, and dynamic security
evidence are not yet complete.

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

## 3. API Surface

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/appointments/:appointmentId/documents` | Upload one document | Owning client |
| `GET` | `/api/appointments/:appointmentId/documents` | List appointment documents | Assigned client or lawyer |
| `GET` | `/api/documents/:documentId/download` | Download and decrypt a document | Assigned client or lawyer |
| `POST` | `/api/appointments/:appointmentId/messages` | Send one message | Assigned client or lawyer; approved appointment |
| `GET` | `/api/appointments/:appointmentId/messages` | List message history | Assigned client or lawyer |

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
| Audit logging | Document access is not logged | Record upload and download security events without logging document content |
| Retention | Deletion and retention are not implemented | Define legal retention, secure deletion, and authorization rules |
| Messaging UI | React escaped-text interface implemented | Verify XSS payloads remain text in every supported browser |
| Message abuse | Length is bounded but send volume is not | Add message-specific throttling, quotas, and abnormal-volume monitoring |
| Message status | No read receipts or unread state | Add only if required, with recipient-scoped updates |
| Message alerts | Generic no-preview notification implemented | Verify recipient scope, idempotency, and polling behavior |
| Alert consistency | Notification writes are intentionally non-blocking | Add reconciliation for rare message-without-alert failures |
| Message key lifecycle | Separate environment key is required | Define rotation, key versioning, backup, and recovery |
| Message retention | Messages are immutable indefinitely | Define retention and legally authorized deletion policy |

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
- Git commit containing this backend increment and its audit report.

## 9. Sprint 3 Work Remaining

1. Implement append-only security audit logging.
2. Build the administrator audit-log view.
3. Add approved coursework features such as reviews only after core
   confidential workflows are secure.
4. Perform the Sprint 3 security-hardening pass.
5. Execute the dynamic audit matrix and attach evidence.
6. Convert this report from in-progress to retrospective complete.

## 10. Current Assessment

The encrypted document and appointment-messaging workflows are ready for the
next increment but are not yet security closed. Their static
design provides bounded parsing, layered file-type checks, participant-scoped
authorization, non-public encrypted storage, context-bound message encryption,
integrity verification, safe response mapping, and escaped-text rendering.

The main remaining risks are malicious document content, aggregate storage
exhaustion, message-volume abuse, missing CSRF and rate-limit controls, key
lifecycle management, retention, audit logging, notification reconciliation,
and unexecuted multi-role dynamic testing. Sprint 3 must remain open until
those items are either implemented or formally recorded as accepted project
limitations.
