# Verified Reputation Platform — MVP Design

Date: 2026-06-23

Status: Approved design

Implementation location: `trust-platform/`

## 1. Executive Summary

Build a new, independent web application that lets AI automation consultants and AI consultants turn completed client work into portable, verified evidence.

The MVP has one core flow:

1. An independent professional registers a completed project.
2. The platform sends a verification request to the client’s company email.
3. The client reviews the claims, corrects or rejects them, and chooses exactly what may be public.
4. The professional publishes the approved evidence on a shareable public profile.

The initial market is:

- Supply: AI automation consultants and AI consultants worldwide.
- Demand context: companies in the United States and United Kingdom.
- Product language: English first.

The MVP does not include talent search, introductions, payments, escrow, referral commissions, or a public marketplace.

## 2. Product Position

The product is not a general review site and not a freelance marketplace. It is a portable B2B trust layer.

Its primary promise is:

> Turn completed client work into client-approved, verifiable evidence that an independent professional can carry to future opportunities.

The product must distinguish between:

- A professional’s unverified claim.
- A project confirmed by someone controlling a company email address.
- Information the company explicitly approved for public display.
- A formal legal endorsement by the company.

Company-domain verification proves control of a mailbox on that domain. It must never be described as proof that the company’s legal entity formally endorsed the professional.

## 3. Goals

### 3.1 User goals

- Let a professional create a credible project record in under ten minutes.
- Let a client verify or reject it without creating an account.
- Let the client independently control the public visibility of company name, reviewer identity, outcome details, metrics, and comments.
- Produce a public profile that clearly separates verified evidence from self-authored content.
- Allow a client to withdraw public consent or dispute evidence after publication.

### 3.2 Business goals

- Validate whether professionals will request verification from previous clients.
- Validate whether company contacts will complete a short verification flow.
- Build the initial verified trust graph manually before opening a marketplace.
- Reach the first 100 verified project records before adding talent search.

### 3.3 Initial success measures

- Verification request completion rate.
- Median time from request sent to verification completed.
- Percentage of verified projects that become public.
- Percentage of public profiles shared at least once.
- Dispute and withdrawal rate.
- Number of professionals with two or more verified projects.

## 4. Non-Goals

The MVP will not include:

- Talent discovery or marketplace search.
- Company-to-company introductions.
- Platform payments, escrow, invoicing, or contracts.
- Referral fees or rewards.
- Public star ratings or aggregate reputation scores.
- Anonymous public reviews.
- File uploads such as contracts, invoices, or email archives.
- LinkedIn, Upwork, or CRM integrations.
- AI-generated testimonials.
- Formal company authorization or legal-entity verification.
- Native mobile applications.

## 5. User Roles

### 5.1 Independent professional

The only persistent authenticated user in the MVP.

The professional can:

- Create and edit a private profile.
- Create project drafts.
- Send and resend verification requests within rate limits.
- Track verification status.
- Review the exact client-approved revision.
- Publish or withdraw verified evidence.
- Copy and share the public profile URL.

The professional cannot:

- Modify an approved revision and keep its verified status.
- Publish fields the client did not approve.
- Submit a verification on behalf of the client.

### 5.2 Company reviewer

A client contact invited through a company email address. The reviewer does not create a persistent account.

The reviewer can:

- Authenticate through a time-limited invitation and email OTP.
- Confirm whether the project existed.
- Accept, correct, make private, or reject submitted claims.
- State whether they would work with the professional again.
- Add an optional short comment.
- Select the public visibility of each sensitive field.
- Preview exactly what will be public.
- Submit once.
- Later withdraw consent or open a dispute through a separate secure receipt link and a fresh email OTP.

### 5.3 Platform administrator

An internal operational role, excluded from the first public UI.

The administrator may:

- Review disputes.
- Suspend abusive accounts.
- Revoke evidence.
- Inspect sanitized audit history.

Administrative access must use a separate protected path and must not rely on ordinary user metadata for authorization.

## 6. Core User Flow

### 6.1 Professional registration and authentication

- The professional signs up with email-based passwordless authentication.
- Supabase Auth uses a PKCE-compatible magic-link or OTP flow.
- The authenticated session is stored in secure cookies.
- Profile creation requests name, public slug, title, location/time zone, and service categories.

### 6.2 Project creation

The project form collects:

- Project title.
- Client company name.
- Client website, optional.
- Company verification domain.
- Reviewer company email.
- Service category.
- Project period.
- Professional’s role.
- Short project summary.
- Outcome statement.
- Optional outcome metric and unit.

The form explains that the information remains private until the company reviewer approves fields for public use.

The reviewer email domain must match the company verification domain. Known consumer email domains are rejected for MVP verification requests.

### 6.3 Verification request

When the professional sends the request:

- The current project content is frozen as a numbered revision.
- A cryptographically random invitation token is generated.
- Only its SHA-256 hash is stored.
- The request expires after 72 hours.
- The company reviewer receives the invitation at the submitted email.
- Opening the link does not consume it, because email security scanners may open links automatically.
- The reviewer requests a separate OTP delivered to the same company mailbox.
- The OTP proves mailbox control and protects against a forwarded invitation URL. It is not described as multi-factor authentication.

The initial request may be followed by one reminder. Additional sends require a cooldown and are subject to account, destination, and IP-based limits.

### 6.4 Company review

After successful invitation-token and OTP validation, the reviewer sees:

- The professional’s identity.
- The submitted project claims.
- A statement that the reviewer controls publication.
- A statement that verification represents the reviewer’s response, not necessarily formal authorization by the company.

The reviewer must answer:

- Did this project or engagement exist?
- Is the professional’s role accurate?
- Is the outcome statement accurate?
- Is the outcome metric accurate, if present?
- Would you work with this professional again? `yes`, `maybe`, or `no`.

For editable claims, the reviewer can:

- Accept the submitted wording.
- Replace it with corrected wording.
- Mark it private.
- Reject the verification.

The reviewer may add an optional comment.

### 6.5 Visibility consent

The reviewer selects public visibility independently for:

- Company name.
- Reviewer name.
- Reviewer job title.
- Project period.
- Outcome statement.
- Outcome metric.
- Reviewer comment.
- Rehire response.

Before submission, the platform renders a public-preview card containing only the selected fields.

### 6.6 Professional publication

The submitted review creates an immutable approved revision.

The professional may:

- Publish that revision exactly as approved.
- Keep it private.
- Abandon it and create a new project revision requiring new verification.

Publishing creates a sanitized public projection. Public pages never read private project and verification rows directly.

### 6.7 Withdrawal and dispute

The company reviewer receives a secure receipt containing:

- A summary of what was approved.
- A link to withdraw public consent.
- A link to dispute the evidence.

The receipt link identifies the verification but does not reveal sensitive details or authorize a change by itself. The reviewer must complete a fresh OTP challenge sent to the original company email before viewing the full receipt, withdrawing consent, or opening a dispute.

Company withdrawal immediately removes the public projection and requires a new verification before republication. A dispute also immediately removes it and changes the project to `disputed` until manual review is complete.

## 7. Project State Model

Supported project states:

- `draft`: Editable by the professional.
- `sent`: Verification request sent.
- `viewed`: Invitation opened but verification not submitted.
- `verified`: Company submitted an approved revision.
- `published`: Approved revision is publicly visible.
- `withdrawn`: Public consent or publication was withdrawn.
- `expired`: Active verification request expired.
- `declined`: Company rejected the request or project claim.
- `disputed`: Published or verified evidence is under dispute and not public.

Rules:

- Editing a project after `sent` creates a new revision and invalidates the pending request.
- Editing verified content creates a new draft and removes verified status from the edited version.
- A `declined` revision cannot be published.
- A `disputed` project is immediately removed from public output.
- A professional may republish a professionally withdrawn revision only while the company consent remains active.
- A company-consent withdrawal requires a new verification before the evidence can be published again.
- State changes are appended to audit history.
- State history is never silently overwritten.

## 8. Application Architecture

### 8.1 Repository boundary

Create a fully independent Next.js application at:

```text
trust-platform/
```

It has its own:

- `package.json`.
- lockfile.
- Next.js configuration.
- TypeScript configuration.
- environment variables.
- test configuration.
- Supabase project and migrations.
- deployment configuration.

No imports are shared with the existing root `ai-work-log` application. The new directory must be independently movable to a separate repository.

### 8.2 Technology

- Next.js 16 App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase Postgres.
- Resend-compatible transactional email adapter.
- Zod for server-side validation.
- Playwright for end-to-end tests.
- Vitest or the project-standard lightweight test runner for unit tests.

Implementation must follow the installed Next.js documentation under `node_modules/next/dist/docs/`, not assumptions from earlier Next.js versions.

### 8.3 Next.js boundaries

- Server Components are the default.
- Client Components are used only for interactive forms, previews, and pending-state UI.
- Server Actions handle authenticated first-party mutations.
- Route Handlers handle invitation validation, OTP operations, email callbacks, withdrawals, and disputes.
- Every Server Action and Route Handler performs authentication or capability authorization internally.
- A server-only Data Access Layer performs authorization and returns minimal DTOs.
- Secret environment variables are accessed only by server-only modules.

### 8.4 Suggested routes

```text
/
/sign-in
/onboarding
/dashboard
/projects/new
/projects/[projectId]
/verify/[requestId]
/verify/[requestId]/preview
/verification-receipt/[receiptToken]
/p/[slug]
/legal/privacy
/legal/terms
/legal/verification-policy
```

API and callback routes live under `app/api/` where a user-facing page exists at the same URL segment.

## 9. Data Model

### 9.1 `profiles`

- `id` UUID primary key.
- `user_id` UUID unique foreign key to `auth.users`.
- `slug` case-insensitive unique public identifier.
- `display_name`.
- `headline`.
- `bio`.
- `country_code`.
- `time_zone`.
- `service_categories`.
- `is_public`.
- timestamps.

### 9.2 `projects`

- `id`.
- `owner_id`.
- `status`.
- `current_revision_id`.
- `verified_revision_id`, nullable.
- `published_at`, nullable.
- `withdrawn_at`, nullable.
- timestamps.

### 9.3 `project_revisions`

- `id`.
- `project_id`.
- `revision_number`.
- `created_by_type`.
- `title`.
- `company_name`.
- `company_website`, nullable.
- `company_domain`.
- `service_category`.
- `project_start`, nullable.
- `project_end`, nullable.
- `role_description`.
- `summary`.
- `outcome_statement`.
- `outcome_metric_value`, nullable.
- `outcome_metric_unit`, nullable.
- `content_hash`.
- timestamps.

Revisions are immutable after they are attached to a sent request or submitted verification.

### 9.4 `verification_requests`

- `id`.
- `project_revision_id`.
- `reviewer_email`.
- `reviewer_email_normalized_hash`.
- `invitation_token_hash`.
- `expires_at`.
- `viewed_at`, nullable.
- `consumed_at`, nullable.
- `revoked_at`, nullable.
- `otp_hash`, nullable.
- `otp_expires_at`, nullable.
- `otp_failed_attempts`.
- `locked_until`, nullable.
- `reminder_count`.
- timestamps.

### 9.5 `verifications`

- `id`.
- `verification_request_id` unique.
- `approved_revision_id`, nullable when declined.
- `project_existed`.
- `role_accurate`.
- `outcome_accurate`.
- `metric_accurate`, nullable.
- `rehire_response`.
- `reviewer_name`, nullable.
- `reviewer_job_title`, nullable.
- `reviewer_comment`, nullable.
- Visibility booleans for each publishable field.
- `company_domain_verified`.
- `consent_status`.
- `reviewer_receipt_token_hash`.
- `submitted_at`.
- `withdrawn_at`, nullable.
- `disputed_at`, nullable.

### 9.6 `published_evidence`

A sanitized projection containing only fields approved for publication.

- `id`.
- `profile_id`.
- `project_id` unique.
- Public title and category.
- Approved public company label, nullable.
- Approved public outcome text, nullable.
- Approved public metric fields, nullable.
- Approved reviewer attribution, nullable.
- Verification badge type.
- `published_at`.
- `active`.

Anonymous users receive `SELECT` access only to active rows in this projection and to public profile fields. They receive no access to private source tables.

### 9.7 `audit_events`

- `id`.
- `actor_type`.
- `actor_id`, nullable.
- `event_type`.
- `object_type`.
- `object_id`.
- Sanitized metadata.
- `created_at`.

Application roles cannot update or delete audit events. Sensitive tokens, OTP values, full IP addresses, and email content must not be written to audit metadata.

Foreign-key and RLS predicate columns must be indexed.

## 10. Security Requirements

### 10.1 Database isolation

- Enable and force Row Level Security on all user-owned and private tables.
- Users can access only rows owned by their authenticated user ID.
- `anon` receives no direct access to private tables.
- Public access is limited to the sanitized `published_evidence` projection and public profile DTO.
- Use the principle of least privilege for database grants.
- The Supabase service-role key is server-only and never appears in browser code, public environment variables, logs, or error messages.

### 10.2 Invitation and OTP security

- Invitation tokens contain at least 256 bits of cryptographic randomness.
- Store only token hashes.
- Reviewer receipt tokens also contain at least 256 bits of cryptographic randomness and are stored only as hashes.
- Use constant-time comparison where application comparison is required.
- Invitation validity is 72 hours.
- Submission consumes the request atomically.
- OTP lifetime is short and configurable, with a target of ten minutes.
- Repeated OTP failures trigger temporary lockout.
- Rate-limit by request, reviewer destination, professional account, and IP.
- Do not reveal whether a reviewer email exists through public error messages.
- Prevent parallel submissions with a unique verification constraint and transaction-level checks.
- Require a fresh OTP to the original reviewer email before receipt viewing, consent withdrawal, or dispute submission.

### 10.3 Web security

- Secure, HttpOnly, SameSite cookies for authenticated sessions.
- Explicit allowed-origin checks for sensitive Route Handlers.
- Server-side Zod validation for every mutation.
- Output encoding and sanitization for user-authored text.
- Content Security Policy.
- No secrets in `NEXT_PUBLIC_*` variables.
- Generic client-facing error messages with server-side correlation IDs.

### 10.4 Privacy and consent

- Collect only data needed for verification and display.
- Do not publicly expose reviewer email, private contact details, IP address, contract data, invoice data, or email contents.
- Store reviewer email only in private, access-restricted data.
- Show the exact public preview before reviewer submission.
- Preserve the reviewer’s consent record and approved revision hash.
- Provide withdrawal and dispute mechanisms.
- Support profile deletion and reviewer-data deletion requests, subject to narrowly documented fraud-prevention and legal-retention needs.
- English-language privacy policy, terms, and verification policy are required before production launch.

### 10.5 Audit and incident readiness

- Record invitation creation, send, view, OTP success/failure category, submission, publication, withdrawal, dispute, and administrative action.
- Use application audit events for business actions.
- Enable scoped Postgres auditing for privileged writes where operationally appropriate.
- Avoid global verbose auditing that records sensitive values or creates excessive logs.

## 11. Email Behavior

Use an email provider adapter so the provider can be changed without changing domain logic.

Required templates:

- Professional sign-in.
- Verification request.
- Verification reminder.
- Verification completed.
- Verification declined.
- Company receipt.
- Withdrawal confirmation.
- Dispute confirmation.

Every verification email must:

- Identify the requesting professional.
- Explain why the recipient received it.
- State that no account is required.
- Avoid claiming formal company endorsement.
- Link to privacy and verification policies.
- Include a way to report abuse without completing verification.

## 12. Error and Abuse Handling

- Expired invitation: show expiration and allow the professional to issue a replacement.
- Revoked invitation: show a generic invalid-link response.
- Link opened by a scanner: do not consume or mark verification complete.
- Invalid OTP: show remaining ability without revealing internal thresholds.
- Locked request: require cooldown or a new request.
- Consumer email domain or company-domain mismatch: reject the verification request and explain how to correct the company verification domain.
- Company correction: create an immutable company-approved revision.
- Company decline: set `declined`, notify the professional, and prohibit publication.
- Professional edits after approval: create a new unverified revision.
- Dispute: immediately deactivate public evidence and queue manual review.
- Abuse reports: preserve relevant audit records while limiting visibility.

## 13. Internationalization

- English is the launch language.
- All user-facing strings must be structured for later localization.
- Store timestamps in UTC and render in the user’s time zone.
- Store countries as ISO codes.
- Use locale-aware date formatting.
- Avoid US-only address, phone, tax, or business-entity assumptions.
- Architecture must support EU privacy obligations even though initial commercial focus is the US and UK.

The MVP must not claim legal compliance certification. Legal review is required before broad production launch.

## 14. Public Profile

The public profile route is `/p/[slug]`.

It displays:

- Professional name and headline.
- Service categories.
- Location or time-zone availability if the professional made it public.
- Count of active verified projects.
- Individual verified evidence cards.
- A clear explanation of what “verified” means.

It does not display:

- Unverified drafts.
- Declined, expired, withdrawn, or disputed evidence.
- Any field not approved by the reviewer.
- A numeric reputation score.
- Hidden reviewer or company identifiers.

Open Graph images must be generated only from the same sanitized public DTO used by the page.

## 15. Testing Strategy

### 15.1 Unit tests

- Project state-transition rules.
- Revision immutability.
- Public projection generation.
- Visibility-consent filtering.
- Token hashing and expiration.
- OTP attempt and lockout rules.
- Domain classification.
- Rate-limit policy helpers.

### 15.2 Database tests

- RLS prevents one professional from reading or mutating another professional’s rows.
- Anonymous access to private tables returns no rows.
- Anonymous access returns only active published evidence.
- Foreign-key and uniqueness constraints enforce one submitted verification per request.
- Audit events cannot be updated or deleted by application roles.
- Dispute and withdrawal atomically deactivate public evidence.

Use pgTAP or equivalent migration-level database tests.

### 15.3 Integration tests

- Authenticated project creation.
- Verification request generation.
- Invitation and OTP validation.
- Company corrections creating an approved revision.
- Publication creating sanitized evidence.
- Withdrawal and dispute flows.
- Email-provider adapter behavior.

### 15.4 End-to-end tests

- Professional signs in, creates a project, and sends a request.
- Company reviewer authenticates, reviews, consents, previews, and submits.
- Professional publishes the approved revision.
- Public profile shows only approved fields.
- Company withdraws consent and the evidence immediately disappears.

### 15.5 Security acceptance tests

- A user cannot access another user’s project by changing an ID.
- An invitation cannot be reused after submission.
- Expired, revoked, and locked invitations cannot submit.
- Parallel submissions create only one verification.
- Private fields do not appear in HTML, serialized React payloads, API responses, logs, or Open Graph images.
- Service-role credentials are absent from browser bundles.
- Rate limits reject sustained abuse with safe error responses.
- User-authored text cannot execute scripts.

## 16. MVP Acceptance Criteria

The MVP is complete when:

- It runs as an independent application under `trust-platform/`.
- A professional can complete the full private workflow.
- A company reviewer can complete verification without creating an account.
- Link plus email OTP validation is enforced.
- Every private table has tested RLS policies.
- The reviewer controls field-level public consent.
- Public evidence is generated from a sanitized projection.
- Editing approved content requires re-verification.
- Withdrawal and dispute immediately remove public evidence.
- Audit history records all material state changes.
- Unit, database, integration, end-to-end, and security acceptance tests pass.
- English privacy, terms, and verification-policy pages exist.
- Production secrets are server-only.
- The existing root `ai-work-log` application continues to build unchanged.

## 17. Deferred Phases

After the MVP proves verification demand:

1. Company talent pools and reusable reviewer accounts.
2. Company-to-company introduction requests.
3. Search across public verified professionals.
4. Referral incentives based on completed introductions, never on positive review sentiment.
5. Integrations with LinkedIn, CRMs, procurement systems, and freelance platforms.
6. Payments, escrow, compliance, and contractor-management capabilities only after separate legal and operational design.

## 18. Reference Material

- Next.js installed documentation:
  - `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`
  - `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
  - `node_modules/next/dist/docs/01-app/02-guides/data-security.md`
  - `node_modules/next/dist/docs/01-app/02-guides/forms.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase passwordless email login: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase authentication rate limits: https://supabase.com/docs/guides/auth/rate-limits
- Supabase Postgres auditing: https://supabase.com/docs/guides/database/extensions/pgaudit
- FTC fake reviews and testimonials rule: https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials
- EU GDPR legal framework: https://commission.europa.eu/law/law-topic/data-protection/legal-framework-eu-data-protection_en
- EU Digital Services Act: https://digital-strategy.ec.europa.eu/en/policies/digital-services-act
- California CCPA: https://oag.ca.gov/privacy/ccpa
