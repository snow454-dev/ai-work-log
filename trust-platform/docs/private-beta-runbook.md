# Proofboard private beta runbook

This runbook is for the first controlled beta with known professionals and known company reviewers. It assumes the product is not yet ready for open public launch.

## Beta entry criteria

- GitHub Actions is green on the release branch.
- `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` pass locally or in CI.
- `npm run beta:check-env:prod` passes in the deployment environment.
- Hosted Supabase migrations are applied.
- Supabase Auth redirect URLs include the deployed `APP_URL`.
- Transactional email is configured with a verified sender domain.
- `/api/health` returns `ok: true` on the deployed app.
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
- `MAIL_TRANSPORT`
- `MAIL_FROM`

Production beta should use:

- `MAIL_TRANSPORT=resend`
- `RESEND_API_KEY`
- `APP_URL=https://...`
- a verified sender in `MAIL_FROM`
- unique random values for both peppers

Generate peppers with:

```bash
openssl rand -base64 48
```

Run:

```bash
npm run beta:check-env:prod
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

## Email setup

For beta, use a verified transactional email provider account.

Required smoke checks:

- Professional sign-in magic link is delivered.
- Company verification invitation is delivered.
- Company OTP email is delivered.
- Verification receipt email is delivered.

Do not invite external company reviewers while `MAIL_TRANSPORT=smtp` or `MAIL_FROM` uses an example domain.

## Deployment smoke test

After deployment:

1. Open `/api/health` and confirm `ok: true`.
2. Open `/?lang=ja` and confirm the Japanese landing page renders.
3. Sign in as a professional.
4. Create or update a profile.
5. Create one completed project using a friendly company-domain reviewer email.
6. Send the verification request.
7. Ask the reviewer to open the invitation link, request OTP, and submit the review.
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
