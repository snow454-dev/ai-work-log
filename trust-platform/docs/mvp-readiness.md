# JISSEKI MVP readiness

## Current start line

The MVP is ready for a controlled private beta with known AI developers, known company reviewers, and small design-partner walkthroughs.

It is not ready for open public launch until counsel-reviewed legal terms, abuse handling, support workflows, and operational monitoring are stronger.

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
- AI developer beta page: `http://localhost:3000/developers?lang=ja`
- Company buyer beta page: `http://localhost:3000/companies?lang=ja`
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
- AI developer and company buyer landing pages for purchase-intent review
- Private beta access request intake for AI developers and company buyers
- Beta access submitted state with clear next-step guidance
- Japanese support across the public UI, workspace, and company review flow
- Runtime health endpoint for deployment smoke checks
- Environment checker for local and production beta settings
- Local demo page and seeded public proof data

## Before inviting the first private beta cohort

- Confirm hosted Supabase migrations are applied.
- Confirm production env vars and email transport are configured.
- Confirm `BETA_ACCESS_NOTIFY_EMAIL` is configured so public beta access requests notify an operator.
- Run `npm run beta:release-check -- --url https://jisseki.io`, or the equivalent CI smoke workflow.
- Confirm `/api/health` returns `ok: true`.
- Confirm `/beta-access?intent=company&lang=ja` captures a design-partner request after hosted migrations are applied.
- Run one manual end-to-end smoke with a friendly company-domain reviewer.
- Review beta privacy notice and terms with the first design partners.
- Invite only known users and companies for the first cohort.

See `docs/private-beta-runbook.md` for the full release checklist.

## Rough remaining effort

- Founder demo / clickable prototype: done
- Local real-data smoke test: less than 1 day after local Supabase is available
- Private beta with 3-5 known users: ready after the final manual end-to-end smoke with the first cohort emails
- Public launch candidate: 1-2 weeks, mostly deployment, legal, security, and operational hardening
