#!/usr/bin/env node

import process from "node:process";

function usage() {
  console.error(`Usage:
  npm run beta:smoke -- --url https://your-deployment.example.com

You can also set APP_URL and run:
  APP_URL=https://your-deployment.example.com npm run beta:smoke
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

if (!baseUrl) {
  usage();
  process.exit(1);
}

const checks = [
  {
    name: "health endpoint returns ok",
    path: "/api/health",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
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

      return body.includes("メールアドレス") &&
        body.includes("安全なリンクをメールで受け取る")
        ? undefined
        : "Expected Japanese sign-in content";
    },
  },
];

console.log(`Proofboard private beta smoke test: ${baseUrl}`);

let failures = 0;

for (const check of checks) {
  const url = `${baseUrl}${check.path}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "proofboard-beta-smoke/1.0",
      },
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
