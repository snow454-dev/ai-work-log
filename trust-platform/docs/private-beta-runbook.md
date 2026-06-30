# Proofboard private beta runbook

This runbook is for the first controlled beta with known professionals and known company reviewers. It assumes the product is not yet ready for open public launch.

## Beta entry criteria

- GitHub Actions is green on the release branch.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass locally or in CI.
- `npm run beta:release-check` passes before deployment.
- `npm run beta:check-env:prod` passes in the deployment environment.
- `npm run beta:release-check -- --url https://YOUR-DEPLOYED-APP` passes after deployment.
- The manual GitHub Actions workflow `Trust Platform Beta Smoke` passes for the deployed URL, if you prefer CI-hosted smoke checks.
- Hosted Supabase migrations are applied.
- Supabase Auth redirect URLs include the deployed `APP_URL`.
- Transactional email is configured with a verified sender domain.
- `/api/health` returns `ok: true` on the deployed app, including `checks.betaAccess.allowlistConfigured: true`.
- Privacy and terms pages have been reviewed for the first design partners.

## Environment variables

Use separate values for local, staging, and production beta.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `APP_URL`
- `TOKEN_PEPPER`
- `OTP_PEPPER`
- `BETA_ALLOWED_EMAILS`
- `MAIL_TRANSPORT`
- `MAIL_FROM`

Production beta should use:

- `MAIL_TRANSPORT=resend`
- `RESEND_API_KEY`
- `APP_URL=https://...`
- a verified sender in `MAIL_FROM`
- unique random values for both peppers
- `BETA_ALLOWED_EMAILS` set to exact professional account emails for the first cohort

Generate peppers with:

```bash
openssl rand -base64 48
```

Or print a complete production-beta env template with fresh random peppers:

```bash
npm run beta:print-env
```

Run:

```bash
npm run beta:check-env:prod
```

Or run the full pre-deployment release gate:

```bash
npm run beta:release-check
```

If you keep production-beta values in a local file before copying them into Vercel, validate that file directly:

```bash
npm run beta:release-check -- --env-file .env.production.local
```

## Supabase setup

1. Create a hosted Supabase project.
2. Apply all migrations in `supabase/migrations`.
3. Confirm Row Level Security remains enabled.
4. Configure Auth email magic links to redirect to:

   ```text
   https://YOUR_APP_URL/auth/confirm
   ```

5. Configure allowed site URLs and redirect URLs for the deployed domain.
6. Keep the service role key server-only.

## Vercel setup

Create one Vercel project for the beta app:

- Root Directory: `trust-platform`
- Framework Preset: Next.js
- Install Command: `npm ci`
- Build Command: `npm run build`
- Development Command: `npm run dev`

These commands are also pinned in `vercel.json` so the deployment does not accidentally build another app in the repository.

## Professional access control

Set `BETA_ALLOWED_EMAILS` before inviting users. It is a comma or newline separated list of exact professional account emails.

Example:

```dotenv
BETA_ALLOWED_EMAILS=founder@example.com,design-partner@example.com
```

When this variable is set, only listed professionals can request sign-in magic links. Company reviewers are not blocked by this setting because they use scoped verification links and OTP.

In deployed beta environments, `/api/health` fails when this allowlist is missing. That makes the smoke test catch accidental open signup before customer invitations go out.

## Email setup

For beta, use a verified transactional email provider account.

Required smoke checks:

- Professional sign-in magic link is delivered.
- Company verification invitation is delivered.
- Company OTP email is delivered.
- Verification receipt email is delivered and its receipt link opens without exposing private project details.

Do not invite external company reviewers while `MAIL_TRANSPORT=smtp` or `MAIL_FROM` uses an example domain.

## Deployment smoke test

After deployment:

1. Run the local release gate against the deployed URL:

   ```bash
   npm run beta:release-check -- --url https://YOUR-DEPLOYED-APP
   ```

   Alternatively, open GitHub Actions, run `Trust Platform Beta Smoke`, and enter the deployed app URL.

2. Sign in as a professional.
3. Create or update a profile.
4. Create one completed project using a friendly company-domain reviewer email.
5. Send the verification request.
6. Ask the reviewer to open the invitation link, request OTP, and submit the review.
7. Open the verification receipt link from the reviewer receipt email.
8. Publish the approved proof.
9. Submit a structured reference request from the public profile.
10. Confirm the owner dashboard shows the request and accept/decline works.

## First cohort recommendation

Start with 3-5 known professionals. Ask each to bring one company reviewer who already expects the request.

Good first users:

- completed B2B projects,
- clear company-domain reviewer,
- low legal/compliance friction,
- willing to give feedback quickly.

Avoid in the first cohort:

- regulated customer data,
- confidential project details,
- anonymous marketplaces where no company reviewer can validate the work,
- cold outreach to companies that are not expecting the verification email.

## Rollback and incident posture

If anything behaves unexpectedly:

- stop sending new verification requests,
- keep already collected proof private,
- preserve audit logs,
- rotate exposed credentials immediately if a secret may have leaked,
- notify affected beta participants directly.

The product should remain private-beta until legal review, abuse handling, monitoring, and support workflows are stronger.
