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
    "User-Agent": "jisseki-beta-smoke/1.0",
  };

  if (vercelProtectionBypass) {
    requestHeaders["x-vercel-protection-bypass"] = vercelProtectionBypass;
    requestHeaders["x-vercel-set-bypass-cookie"] = "true";
  }

  return requestHeaders;
}

function summarizeHealthResponse(json) {
  if (!json || typeof json !== "object") {
    return "Health response was not a JSON object.";
  }

  const checks = json.checks && typeof json.checks === "object" ? json.checks : {};
  const configuration =
    checks.configuration && typeof checks.configuration === "object"
      ? checks.configuration
      : undefined;
  const betaAccess =
    checks.betaAccess && typeof checks.betaAccess === "object"
      ? checks.betaAccess
      : undefined;
  const adminAccess =
    checks.adminAccess && typeof checks.adminAccess === "object"
      ? checks.adminAccess
      : undefined;

  const details = [];

  if (
    configuration &&
    Array.isArray(configuration.missingOrInvalid) &&
    configuration.missingOrInvalid.length > 0
  ) {
    details.push(
      `missing/invalid env: ${configuration.missingOrInvalid.join(", ")}`,
    );
  }

  if (betaAccess) {
    details.push(
      `betaAccess ok=${String(betaAccess.ok)} required=${String(
        betaAccess.required,
      )} allowlistConfigured=${String(betaAccess.allowlistConfigured)}`,
    );
  }

  if (adminAccess) {
    details.push(
      `adminAccess ok=${String(adminAccess.ok)} required=${String(
        adminAccess.required,
      )} signInConfigured=${String(adminAccess.signInConfigured)}`,
    );
  }

  if (details.length > 0) {
    return details.join("; ");
  }

  return `health ok=${String(json.ok)}`;
}

const checks = [
  {
    name: "health endpoint returns ok",
    path: "/api/health",
    validate: async (response) => {
      const contentType = response.headers.get("content-type") ?? "";

      if (!contentType.includes("application/json")) {
        const body = await response.text();
        return (
          deploymentProtectionError(body) ??
          `Expected JSON health response, got ${contentType || "unknown content type"}`
        );
      }

      const json = await response.json();

      return response.ok && json.ok === true
        ? undefined
        : `Expected health ok, got HTTP ${response.status}. ${summarizeHealthResponse(
            json,
          )}`;
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

      return body.includes("JISSEKI") && body.includes("企業確認")
        ? undefined
        : "Expected JISSEKI Japanese landing content";
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
    name: "browser admin redirects unauthenticated visitors to sign-in",
    path: "/admin?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200 after sign-in redirect, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return response.url.includes("/sign-in?") &&
        body.includes("安全なリンクをメールで受け取る")
        ? undefined
        : "Expected protected /admin to redirect to Japanese sign-in";
    },
  },
  {
    name: "Japanese verified solution discovery renders",
    path: "/solutions?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("実績から、次のAI導入先を探す。") &&
        !body.includes("現在、実績を読み込めません")
        ? undefined
        : "Expected working Japanese verified solution discovery";
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
    name: "Japanese developer page renders",
    path: "/developers?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("AI開発者向け") &&
        body.includes("AI開発者として申請")
        ? undefined
        : "Expected Japanese developer landing content";
    },
  },
  {
    name: "Japanese company page renders",
    path: "/companies?lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("企業向け") && body.includes("企業として申請")
        ? undefined
        : "Expected Japanese company landing content";
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

      return body.includes("JISSEKIのβアクセスを申請する") &&
        body.includes("プライベートβアクセスを申請") &&
        body.includes("企業側として使う")
        ? undefined
        : "Expected Japanese beta access request content";
    },
  },
  {
    name: "Japanese beta access submitted page renders",
    path: "/beta-access?intent=company&submitted=1&lang=ja",
    validate: async (response) => {
      if (!response.ok) {
        return `Expected HTTP 200, got ${response.status}`;
      }

      const body = await response.text();
      const protectionError = deploymentProtectionError(body);

      if (protectionError) {
        return protectionError;
      }

      return body.includes("申請を受け付けました") &&
        body.includes("招待済みならログイン")
        ? undefined
        : "Expected Japanese beta access submitted content";
    },
  },
];

console.log(`JISSEKI private beta smoke test: ${baseUrl}`);

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
