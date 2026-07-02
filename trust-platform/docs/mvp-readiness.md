# JISSEKI MVP readiness

## Current start line

The MVP is ready for local product review, founder demos, and trusted design-partner walkthroughs.

It is close to a controlled private beta, but it is not ready for open public launch until production email, legal review, abuse handling, support workflows, and operational monitoring are configured.

## Local real-data smoke test

1. Start Supabase:

   ```bash
   npm run db:start
   ```

2. Copy local values from `supabase status` into `.env.local` using `.env.example` as the template.

3. Reset and seed the local database:

   ```bash
   npm run db:reset
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open these URLs:

   - Static UI preview: `http://localhost:3000/demo?lang=ja`
   - Health check: `http://localhost:3000/api/health`
   - Seeded public profile: `http://localhost:3000/p/aiko-demo?lang=ja`
   - Seeded reference request form: `http://localhost:3000/p/aiko-demo/reference/00000000-0000-4000-8000-000000000501?lang=ja`

## What works now

- Professional profile and project draft creation
- Company verification request model
- Email OTP reviewer access
- Reviewer-controlled verification and public visibility
- Public proof profile
- Safe reference availability indicator
- Structured reference request capture
- Owner dashboard reference-request inbox
- Owner accept/decline workflow for reference requests
- Basic DB-level public-form rate limiting
- Beta privacy notice, terms, and consent links
- AI developer/company buyer landing page for purchase-intent review
- Private beta access request intake for AI developers and company buyers
- Japanese support across the public UI, workspace, and company review flow
- Runtime health endpoint for deployment smoke checks
- Environment checker for local and production beta settings
- Local demo page and seeded public proof data

## Before a private beta

- Deploy Supabase migrations to a real project
- Configure production env vars and email transport
- Run `npm run beta:check-env:prod` in the deployment environment
- Confirm `/api/health` returns `ok: true`
- Confirm `/beta-access?intent=company&lang=ja` captures a design-partner request after hosted migrations are applied
- Run DB tests against a working local or staging Supabase instance
- Review beta privacy notice and terms for the first design partners
- Invite only known users and companies for the first cohort

See `docs/private-beta-runbook.md` for the full release checklist.

## Rough remaining effort

- Founder demo / clickable prototype: done
- Local real-data smoke test: less than 1 day after local Supabase is available
- Private beta with 3-5 known users: roughly 1 focused workday after deployment credentials and production email are ready
- Public launch candidate: 1-2 weeks, mostly deployment, legal, security, and operational hardening
