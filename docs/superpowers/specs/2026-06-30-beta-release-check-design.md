# Beta release check design

## Goal

Make the private-beta launch safer with one minimal command that verifies the app is ready before inviting real customers.

## Scope

Add a `beta:release-check` command inside `trust-platform` that runs the existing checks in the same order a founder/operator should use before opening the beta:

1. production beta environment validation,
2. TypeScript typecheck,
3. lint,
4. unit tests,
5. production build,
6. optional deployed smoke test when a URL is provided.

This does not automate external account creation, secrets entry, Vercel deployment, Supabase project setup, Supabase migrations, or Resend sender verification. Those remain human-controlled because they require account access and secrets.

## Interface

The command will be:

```bash
npm run beta:release-check
```

Optional smoke test:

```bash
npm run beta:release-check -- --url https://your-deployed-app.example.com
```

If `--url` is omitted, the script will skip the deployed smoke test and clearly say why.

## Implementation

Add `scripts/release-check.mjs` and wire it into `package.json`.

The script will spawn existing npm scripts rather than duplicate validation logic:

- `beta:check-env:prod`
- `typecheck`
- `lint`
- `test`
- `build`
- `beta:smoke -- --url ...` only when `--url` exists

It will stop at the first failure and print the failed step name. This keeps the implementation small and avoids hiding broken checks behind a custom framework.

## Documentation

Update the README and private beta runbook to make `beta:release-check` the final command before inviting customer beta users.

## Testing

Verify:

- `npm run beta:release-check` reaches the expected environment-validation failure when production secrets are not configured locally.
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

The actual deployed smoke test remains dependent on a real deployed URL.
