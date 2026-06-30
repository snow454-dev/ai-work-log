# Beta smoke workflow design

## Goal

Make post-deployment private-beta checks repeatable from GitHub Actions after the app is deployed to Vercel or another Node-capable host.

## Scope

Add a manual GitHub Actions workflow that accepts a deployed app URL and runs the existing deployed smoke checks against that URL.

This should not run on every push because normal CI does not have a deployed beta URL. It should not require production secrets because the smoke script only checks public deployed pages and `/api/health`.

## Interface

The workflow will be manually triggered from GitHub Actions with one required input:

- `url`: the deployed app URL, for example `https://proofboard-beta.example.com`

It will run:

```bash
npm run beta:smoke -- --url "$URL"
```

## Implementation

Create `.github/workflows/trust-platform-beta-smoke.yml`.

The workflow will:

1. check out the repository,
2. set up Node.js,
3. install dependencies in `trust-platform`,
4. run the smoke script against the provided URL.

## Documentation

Update the README and private-beta runbook to mention the manual GitHub Actions smoke workflow as the hosted equivalent of running:

```bash
npm run beta:release-check -- --url https://YOUR-DEPLOYED-APP
```

## Testing

Validate the workflow YAML shape locally by inspecting it, then run the existing local quality gate:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

The live workflow can only be fully exercised once a deployed URL exists.
