# Proofboard

Proofboard is a private-beta platform for independent professionals to turn completed client work into company-approved proof and consented reference paths.

The core loop is:

1. A professional records a completed engagement.
2. Proofboard sends a secure verification request to a company-domain email.
3. The company reviewer confirms facts and chooses what may become public.
4. The professional publishes only approved fields and receives structured reference requests before any company reviewer is contacted again.

## Local development

```bash
npm install
cp .env.example .env.local
npm run db:start
npm run db:reset
npm run dev
```

Open:

- App: `http://localhost:3000`
- Japanese UI: `http://localhost:3000/?lang=ja`
- Demo: `http://localhost:3000/demo?lang=ja`
- Health check: `http://localhost:3000/api/health`

After `npm run db:start`, copy Supabase local keys from `supabase status` into `.env.local`.

## Useful commands

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run beta:print-env
npm run beta:check-env
npm run beta:check-env:prod
npm run beta:check-env:prod -- --env-file .env.production.local
npm run beta:release-check
npm run beta:release-check -- --env-file .env.production.local
npm run beta:smoke -- --url https://your-deployment.example.com
```

`beta:print-env` prints a production-beta environment template with fresh random peppers. Paste the values into the deployment provider's encrypted environment-variable settings; do not commit real values.

`beta:check-env:prod` intentionally fails when production settings still use placeholders, localhost URLs, SMTP, or example sender domains.

`beta:smoke` checks a deployed URL after environment variables and migrations are configured.

`beta:release-check` runs the release gate in order: production env validation, typecheck, lint, unit tests, production build, and an optional deployed smoke test when you pass `-- --url https://...`.

Use `-- --env-file .env.production.local` to validate a local production-beta env file before copying values into Vercel.

After deployment, you can also run the manual GitHub Actions workflow `Trust Platform Beta Smoke` with the deployed URL. It runs the same deployed smoke checks from CI.

## Private beta deployment checklist

1. Create a hosted Supabase project.
2. Apply `supabase/migrations`.
3. Create a Vercel project with Root Directory set to `trust-platform`.
4. Configure Supabase Auth magic-link redirect URLs to the deployed `APP_URL`.
5. Configure production env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `APP_URL`
   - `TOKEN_PEPPER`
   - `OTP_PEPPER`
   - `BETA_ALLOWED_EMAILS`
   - `MAIL_TRANSPORT=resend`
   - `RESEND_API_KEY`
   - `MAIL_FROM`
6. Run `npm run beta:release-check`.
7. Deploy the Next.js app. `trust-platform/vercel.json` pins the minimal Next.js build settings.
8. Run `npm run beta:release-check -- --url https://YOUR-DEPLOYED-APP`, or trigger the `Trust Platform Beta Smoke` GitHub Actions workflow with the deployed URL.
9. Run the first real smoke test with a friendly company-domain reviewer email.

See [docs/private-beta-runbook.md](docs/private-beta-runbook.md) for the full beta launch runbook.

## Safety notes

- Do not commit `.env*` files except `.env.example`.
- Do not expose token peppers, OTP peppers, reviewer emails, OTPs, or token hashes to client code or logs.
- The app does not require a Supabase service role key in Vercel; token-gated reviewer and receipt access runs through security-definer RPCs that return only the fields needed for each flow.
- The beta legal pages are lightweight operating terms for known design partners, not final counsel-reviewed public-launch terms.
- Keep the first cohort small: 3-5 known professionals and companies.
- Set `BETA_ALLOWED_EMAILS` before production beta so only invited professionals can create/sign in to workspaces. Company reviewers still use secure invitation links and OTP.
- `/api/health` reports whether the beta allowlist is configured and fails in deployed beta environments when it is missing.
