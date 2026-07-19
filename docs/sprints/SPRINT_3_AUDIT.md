# LexSecure Sprint 3 In-Progress Security Audit

## 1. Sprint Summary

| Field | Value |
| --- | --- |
| Sprint | Sprint 3 - Documents, Communication, and Administration |
| Goal | Deliver secure collaboration between clients and lawyers |
| Functional status | In progress |
| Current increment | Encrypted legal-document upload backend |
| Security status | Design review complete for this increment; dynamic audit remains |
| Audit type | Continuous white-box review |

Sprint 3 has started with the confidential-document backend. An authenticated
client can upload an approved document type to one of their active
appointments. The appointment's client and assigned lawyer can list and
download those documents. Stored files are encrypted and kept outside the
public frontend tree.

This report is intentionally marked in progress. Messaging, audit logging,
administration improvements, the document frontend, and dynamic security
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

## 3. API Surface

| Method | Endpoint | Purpose | Access |
| --- | --- | --- | --- |
| `POST` | `/api/appointments/:appointmentId/documents` | Upload one document | Owning client |
| `GET` | `/api/appointments/:appointmentId/documents` | List appointment documents | Assigned client or lawyer |
| `GET` | `/api/documents/:documentId/download` | Download and decrypt a document | Assigned client or lawyer |

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

Only synthetic legal documents should be used during testing.

## 8. Evidence to Capture for the Coursework

- Burp request and response for an accepted PDF upload.
- Rejected renamed executable and oversized-file responses.
- Before/after storage bytes showing plaintext is encrypted at rest.
- MongoDB metadata screenshot with sensitive fields omitted from API output.
- Client-versus-unrelated-user document IDOR attempts.
- Altered-ciphertext integrity failure.
- Browser download headers showing attachment and `no-store`.
- Git commit containing this backend increment and its audit report.

## 9. Sprint 3 Work Remaining

1. Build the authenticated document upload, list, and download frontend.
2. Implement client-lawyer messaging with strict conversation ownership.
3. Implement append-only security audit logging.
4. Build the administrator audit-log view.
5. Add approved coursework features such as reviews only after core
   confidential workflows are secure.
6. Perform the Sprint 3 security-hardening pass.
7. Execute the dynamic audit matrix and attach evidence.
8. Convert this report from in-progress to retrospective complete.

## 10. Current Assessment

The encrypted document backend is ready for integration but is not yet
security closed. Its static design provides bounded parsing, layered file-type
checks, participant-scoped authorization, non-public encrypted storage,
integrity verification, and safe response mapping.

The main remaining risks are malicious document content, aggregate storage
exhaustion, missing CSRF and rate-limit controls, key lifecycle management,
retention, audit logging, and unexecuted multi-role dynamic testing. Sprint 3
must remain open until those items are either implemented or formally recorded
as accepted project limitations.
