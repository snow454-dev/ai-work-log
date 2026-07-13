# JISSEKI Browser Admin Console Design

Date: 2026-07-13  
Status: Approved direction, pending written-spec review  
Initial administrator: `hello@aisupports.cc`

## 1. Objective

Add a secure browser-based admin console at `/admin` so the first private-beta cohort can be operated without opening Supabase or editing Vercel allowlist variables for every invitation.

The smallest complete flow is:

1. An applicant submits `/beta-access`.
2. An administrator signs in with the existing magic-link flow.
3. The administrator reviews the request in `/admin`.
4. The administrator marks it reviewing, invites it, declines it, or closes it.
5. Inviting grants sign-in permission immediately and attempts to send an invitation email.
6. Every privileged change is checked in PostgreSQL and recorded in the audit log.

## 2. Non-goals

The first version will not include:

- general user management;
- password-based administrator accounts;
- analytics charts;
- CSV export;
- bulk actions;
- billing or payment administration;
- editing published proof or company verification from the admin console;
- direct access to company reviewer contact details;
- a Supabase service-role key in the browser or application runtime.

## 3. Routes and user experience

### `/admin?lang=ja`

Unauthenticated visitors are redirected to:

```text
/sign-in?next=%2Fadmin%3Flang%3Dja&lang=ja
```

A signed-in non-admin receives a not-found response. This avoids confirming that a privileged console exists to ordinary accounts.

The page contains:

- summary counts for new, reviewing, invited, declined, and closed requests;
- filters for status and intent (`developer` or `company`);
- request cards with name, work email, company, role, use case, source path, status, and submission time;
- actions for `Reviewing`, `Invite`, `Decline`, and `Close`;
- a link to `/api/health`;
- a clear private-data notice;
- Japanese and English labels.

The mobile layout uses stacked cards. The desktop layout uses the same cards in a wider grid rather than a dense data table. This keeps the first version usable without adding pagination controls beyond a fixed recent-request limit.

### Action feedback

All actions return an explicit success or failure message. The invite action persists access before attempting email delivery:

- access granted and email sent: show success;
- access granted but email failed: keep the invitation active and show a warning;
- access grant failed: keep the previous request status and show an error.

## 4. Authentication and authorization

### Sign-in permission

Add the server-only environment variable:

```text
ADMIN_ALLOWED_EMAILS=hello@aisupports.cc
```

The existing sign-in action accepts an email when it appears in either:

- the professional beta allowlists;
- the administrator allowlist;
- the database-backed beta invitation hashes.

`ADMIN_ALLOWED_EMAILS` only allows a magic-link request. It does not grant access to admin data.

### Authoritative admin check

Add a forced-RLS table containing normalized administrator emails. The initial migration inserts `hello@aisupports.cc`.

Every admin RPC calls a private `is_current_user_admin()` function that:

1. requires `auth.uid()`;
2. reads the authenticated email from the signed JWT;
3. compares the normalized email with the forced-RLS administrator table;
4. rejects non-admin calls before reading or changing application data.

The table has no direct `anon` or `authenticated` privileges. Admin membership is checked only inside security-definer functions with an empty `search_path`.

## 5. Browser-managed beta invitations

### Stored value

Invitation emails are not stored again in a new public-readable table. The app generates a domain-separated HMAC on the server:

```text
HMAC-SHA256(TOKEN_PEPPER, "beta-invite:" + normalizedEmail)
```

PostgreSQL stores only the resulting hash, the source request ID, the inviting admin user ID, timestamps, and revocation state.

### Sign-in check

Before sending a magic link, the server action computes the same HMAC and asks a narrow RPC whether that opaque hash is active. Existing environment allowlists remain valid as a safe migration fallback.

The public RPC accepts only a 64-character hash and returns a boolean. It never accepts or returns an email address.

### Invite action

The invite RPC performs one transaction:

1. confirm the caller is an administrator;
2. lock and load the beta request;
3. store or reactivate the invitation hash;
4. change the request status to `invited`;
5. append a sanitized `beta_access_request.invited` audit event.

The application then attempts to send an invitation email containing the JISSEKI sign-in URL. Email failure does not roll back the invitation.

## 6. Database interface

The migration adds:

- `app_admin_emails` — forced-RLS administrator membership;
- `beta_invite_hashes` — forced-RLS database-backed sign-in permissions;
- `is_current_user_admin()` — private authorization helper;
- `is_beta_invite_hash_active(hash)` — narrow hash-only lookup;
- `list_admin_beta_access_requests(status, intent, limit, offset)` — admin-only request listing;
- `summarize_admin_beta_access_requests()` — admin-only status counts;
- `update_admin_beta_access_request_status(id, status)` — admin-only non-invite transitions;
- `invite_admin_beta_access_request(id, email_hash)` — atomic invite transition.

Allowed status rules:

- `new` may become `reviewing`, `invited`, `declined`, or `closed`;
- `reviewing` may become `invited`, `declined`, or `closed`;
- `invited`, `declined`, and `closed` may return to `reviewing`;
- only the invite RPC may set `invited` because it must also create the sign-in permission.

Admin RPCs return only the fields required by the console. They do not return reviewer sessions, OTP data, verification tokens, audit metadata, or unpublished project data.

## 7. Application components

### Data layer

`src/data/admin-beta-access.ts` will:

- parse RPC responses with Zod;
- expose list, summary, status update, and invite functions;
- remain `server-only`;
- translate database failures into generic application errors.

### Authentication helper

`src/data/admin-auth.ts` will expose `requireAdmin()` using the current authenticated Supabase client and the database authorization RPC.

### Server actions

`src/app/actions/admin-beta-access.ts` will:

- re-check admin authorization through the database on every mutation;
- validate request IDs and target statuses;
- compute invitation email hashes only on the server;
- persist an invite before sending email;
- revalidate `/admin` after success;
- return localized safe error messages.

### UI

`src/app/admin/page.tsx` is a dynamic, non-indexable server-rendered page. Small client components are permitted only for clipboard interaction or a confirmation prompt. Request data is not placed into public metadata or structured data.

## 8. Security properties

- No Supabase service-role key is introduced.
- Direct reads of `beta_access_requests`, `app_admin_emails`, and `beta_invite_hashes` remain denied.
- Admin authorization is enforced in PostgreSQL, not only by hiding the route.
- Every mutation repeats authorization and does not trust page access alone.
- Invitation lookup uses a domain-separated HMAC rather than a plaintext email.
- Admin pages use `noindex, nofollow` and do not cache private data.
- React escapes applicant text before rendering.
- Status values, UUIDs, filters, limits, and offsets are validated and bounded.
- Audit events contain request IDs and transitions, not applicant email or use-case text.
- Reviewer contact details and project verification secrets are outside the admin RPC interface.

## 9. Failure handling

- Missing or invalid admin environment configuration causes production readiness checks to fail.
- Unauthenticated requests redirect to sign-in.
- Authenticated non-admin requests return not found.
- Database authorization failures return no request data.
- Invalid filters fall back to an unfiltered safe view.
- Invalid status transitions fail without partial updates.
- Invitation email failure leaves browser access enabled and returns a warning so the admin can contact the applicant manually.
- The admin list shows an empty state when no requests match.

## 10. Testing

### Unit and component tests

- administrator emails are normalized correctly;
- admin emails may request a magic link without entering the professional allowlist;
- invitation HMACs are deterministic, domain-separated, and never contain plaintext emails;
- admin data parsers reject malformed RPC results;
- actions reject invalid IDs and status values;
- invitation persistence happens before email sending;
- email failure returns a warning rather than revoking access;
- applicant content is rendered as text.

### PostgreSQL tests

- all new tables use forced RLS and deny direct client reads;
- anonymous and ordinary authenticated users cannot call admin RPCs successfully;
- the seeded administrator can list and update requests;
- only the invite RPC can set `invited`;
- invite creation and status transition are atomic;
- the hash-only sign-in lookup returns only a boolean;
- admin mutations append sanitized audit events.

### Release verification

Run:

```bash
npm run typecheck
npm run lint
npm test
npm run db:test
npm run build
npm run beta:smoke -- --url https://jisseki.io
```

Manual browser verification covers:

1. admin magic-link sign-in;
2. `/admin` request listing and filters;
3. reviewing, invite, decline, and close actions;
4. invited applicant sign-in without a Vercel allowlist change;
5. denial for an ordinary signed-in user;
6. mobile and desktop layouts;
7. absence of private request data in anonymous responses.

## 11. Deployment sequence

1. Apply the database migration.
2. Add `ADMIN_ALLOWED_EMAILS=hello@aisupports.cc` to the production environment.
3. Deploy the application.
4. Confirm `/api/health` reports the admin configuration as present.
5. Sign in as `hello@aisupports.cc` and open `/admin?lang=ja`.
6. Submit a disposable beta request and complete the browser invite flow.
7. Run production smoke tests.

The database migration is additive. Existing environment-based beta invitations continue to work, so rollback can disable the admin route without locking out the current cohort.
