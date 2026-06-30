#!/usr/bin/env node

import process from "node:process";

function usage() {
  console.error(`Usage:
  npm run beta:smoke -- --url https://your-deployment.example.com

You can also set APP_URL and run:
  APP_URL=https://your-deployment.example.com npm run beta:smoke

For Vercel deployments protected by Deployment Protection, set:
  BETA_SMOKE_VERCEL_BYPASS_SECRET=... npm run beta:smoke -- --url https://...
`);
}

function optionValue(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function normalizeBaseUrl(raw) {
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);
    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

const baseUrl = normalizeBaseUrl(optionValue("--url") ?? process.env.APP_URL);
const vercelProtectionBypass =
  process.env.BETA_SMOKE_VERCEL_BYPASS_SECRET ??
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (!baseUrl) {
  usage();
  process.exit(1);
}

function deploymentProtectionError(body) {
  return body.includes("Vercel") && body.includes("Protection")
    ? "Deployment appears to be behind Vercel Deployment Protection. Set BETA_SMOKE_VERCEL_BYPASS_SECRET or disable protection for the smoke test."
    : undefined;
}

function headers() {
  const requestHeaders = {
    "User-Agent": "proofboard-beta-smoke/1.0",
  };

  if (vercelProtectionBypass) {
    requestHeaders["x-vercel-protection-bypass"] = vercelProtectionBypass;
    requestHeaders["x-vercel-set-bypass-cookie"] = "true";
  }

  return requestHeaders;
}

const checks = [
  {
    name: "health endpoint returns ok",
    path: "/api/health",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        const body = await response.text();
        return (
          deploymentProtectionError(body) ??
          `Expected JSON health response, got ${contentType || "unknown content type"}`
        );
      }

      const json = await response.json();

      return json.ok === true ? undefined : "Expected JSON body with ok: true";
    },
  },
  {
    name: "Japanese landing page renders",
    path: "/?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("Proofboard") && body.includes("企業確認")
        ? undefined
        : "Expected Proofboard Japanese landing content";
    },
  },
  {
    name: "Japanese sign-in page renders",
    path: "/sign-in?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("メールアドレス") &&
        body.includes("安全なリンクをメールで受け取る")
        ? undefined
        : "Expected Japanese sign-in content";
    },
  },
  {
    name: "Japanese AI solutions buyer page renders",
    path: "/ai-solutions?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("AI開発者側の価値") &&
        body.includes("セキュリティ上、β利用で問題ない")
        ? undefined
        : "Expected Japanese AI solutions buyer content";
    },
  },
  {
    name: "Japanese beta access request page renders",
    path: "/beta-access?intent=company&lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("Proofboardのβアクセスを申請する") &&
        body.includes("プライベートβアクセスを申請") &&
        body.includes("企業側として使う")
        ? undefined
        : "Expected Japanese beta access request content";
    },
  },
];

console.log(`Proofboard private beta smoke test: ${baseUrl}`);

let failures = 0;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;

  try {
    const response = await fetch(url, {
      headers: headers(),
      redirect: "follow",
    });
    const error = await check.validate(response);

    if (error) {
      failures += 1;
      console.log(`✗ ${check.name}`);
      console.log(`  ${url}`);
      console.log(`  ${error}`);
    } else {
      console.log(`✓ ${check.name}`);
    }
  } catch (error) {
    failures += 1;
    console.log(`✗ ${check.name}`);
    console.log(`  ${url}`);
    console.log(
      `  ${error instanceof Error ? error.message : "Request failed"}`,
    );
  }
}

if (failures > 0) {
  console.error(`\n${failures} smoke check(s) failed.`);
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
