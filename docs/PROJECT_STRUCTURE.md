# LexSecure Project Structure

LexSecure is organized as a split MERN application with a clear boundary between the API server and the React client. The structure supports incremental secure development: authentication, MongoDB models, and business features are added only when requested.

## Top-Level Layout

```text
LexSecure/
+-- client/
+-- docs/
+-- server/
|   +-- package.json
|   +-- .env.example
|   +-- src/
|       +-- app.js
|       +-- server.js
|       +-- config/
|       +-- constants/
|       +-- controllers/
|       +-- middleware/
|       +-- models/
|       +-- routes/
|       +-- services/
|       +-- utils/
|       +-- validators/
+-- package.json
```

## Package Organization

The root `package.json` defines the project as a private npm workspace containing `server` and `client`. This keeps dependency ownership explicit while still allowing shared workspace commands later.

The server package is named `@lexsecure/backend` and uses ES Modules through `"type": "module"`. It is reserved for the Express API and future MongoDB/Mongoose layer.

The client package is reserved for the React client, React Router navigation, Axios API access, and Tailwind CSS styling.

## Backend Folders

`server/src/config/` contains configuration modules such as environment loading, CORS configuration, Helmet configuration, future database configuration, and trusted runtime settings.

`server/src/constants/` will contain fixed application values such as role names, appointment states, document categories, and audit event names.

`server/src/controllers/` contains request handlers. Controllers should stay thin and delegate business rules to services.

`server/src/middleware/` contains Express middleware such as security headers, future session checks, CSRF protection, request validation, upload controls, and centralized error handling.

`server/src/models/` will contain future Mongoose schemas and models. Model files should use singular PascalCase names such as `User.model.js`, `LawyerProfile.model.js`, and `Appointment.model.js`.

`server/src/routes/` contains REST route definitions. Route files should use kebab-case names such as `appointment.routes.js` and `document.routes.js`.

`server/src/services/` will contain future business logic such as appointment scheduling, document access policy checks, notification orchestration, and audit logging.

`server/src/utils/` contains small reusable helpers with no direct Express dependency, such as async request wrappers, secure token helpers, date helpers, and file validation helpers.

`server/src/validators/` will contain request validation rules and sanitization schemas. User input validation belongs here before it reaches controllers.

## Frontend Folders

`frontend/public/` will contain static files served directly by the frontend build tool, such as the future favicon or static metadata files.

`frontend/src/api/` will contain configured Axios clients and API request modules. API files should avoid storing security-sensitive state directly.

`frontend/src/assets/` will contain local images, icons, and other imported static assets.

`frontend/src/components/` will contain reusable UI components that are not tied to one feature.

`frontend/src/config/` will contain frontend-safe configuration, such as public API base URLs. Secrets must never be placed here.

`frontend/src/constants/` will contain fixed UI values such as route labels, appointment statuses, and form option lists.

`frontend/src/features/` will contain feature-specific modules, grouped by domain. Future examples include `appointments`, `documents`, `messages`, `lawyers`, and `admin`.

`frontend/src/hooks/` will contain reusable React hooks.

`frontend/src/layouts/` will contain shared page shells such as authenticated dashboard layouts and public layouts.

`frontend/src/pages/` will contain route-level page components.

`frontend/src/routes/` will contain React Router configuration.

`frontend/src/services/` will contain frontend business helpers that coordinate API calls, browser storage policy, and client-side workflow logic.

`frontend/src/styles/` will contain Tailwind entry styles and future global CSS.

`frontend/src/utils/` will contain small frontend-only utility functions.

## Naming Conventions

Backend model files should use PascalCase with a `.model.js` suffix, for example `Appointment.model.js`.

Backend route files should use kebab-case with a `.routes.js` suffix, for example `lawyer-profile.routes.js`.

Backend controller files should use kebab-case with a `.controller.js` suffix, for example `appointment.controller.js`.

Backend service files should use kebab-case with a `.service.js` suffix, for example `appointment.service.js`.

Frontend component and page files should use PascalCase, for example `AppointmentCard.jsx` and `AppointmentsPage.jsx`.

Frontend hooks should use camelCase and begin with `use`, for example `useAppointmentFilters.js`.

Shared constants should use clear domain names, for example `appointmentStatuses.js` or `userRoles.js`.

## Security-Oriented Separation of Concerns

Input validation should happen before controller logic through validator modules and validation middleware.

Authorization and access-control checks should be centralized in middleware or service-layer policy helpers rather than duplicated in controllers.

Document upload handling should be isolated from general request handling so file type, size, storage, malware scanning, and access-control rules can be reviewed independently.

Audit logging should be treated as a backend service concern so future sensitive actions can emit consistent security events.

Frontend code must treat all server responses as untrusted data and must not store confidential legal documents or sensitive session material in browser storage.
