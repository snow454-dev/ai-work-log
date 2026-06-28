# Proofboard MVP readiness

## Current start line

The MVP is ready for local product review, founder demos, and trusted design-partner walkthroughs.

It is not ready for open public launch until deployment, production email, privacy/legal copy, and abuse controls are configured.

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

   - Static UI preview: `http://localhost:3000/demo`
   - Seeded public profile: `http://localhost:3000/p/aiko-demo`
   - Seeded reference request form: `http://localhost:3000/p/aiko-demo/reference/00000000-0000-4000-8000-000000000501`

## What works now

- Professional profile and project draft creation
- Company verification request model
- Email OTP reviewer access
- Reviewer-controlled verification and public visibility
- Public proof profile
- Safe reference availability indicator
- Structured reference request capture
- Owner dashboard reference-request inbox
- Local demo page and seeded public proof data

## Before a private beta

- Deploy Supabase migrations to a real project
- Configure production env vars and email transport
- Run DB tests against a working local or staging Supabase instance
- Add privacy policy, terms, and consent copy
- Add basic rate limiting or abuse protection for public reference forms
- Add owner workflow for accepting or declining reference requests

## Rough remaining effort

- Founder demo / clickable prototype: done
- Local real-data smoke test: less than 1 day after local Supabase is available
- Private beta with 3-5 known users: 2-4 focused workdays
- Public launch candidate: 1-2 weeks, mostly deployment, legal, security, and operational hardening
