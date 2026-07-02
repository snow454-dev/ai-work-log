#!/usr/bin/env node

import { spawn } from "node:child_process";
import process from "node:process";

function usage() {
  console.log(`Usage:
  npm run beta:release-check
  npm run beta:release-check -- --env-file .env.production.local
  npm run beta:release-check -- --url https://your-deployed-app.example.com

Runs the private-beta release checks in order:
  1. production environment validation
  2. TypeScript typecheck
  3. lint
  4. unit tests
  5. production build
  6. optional deployed smoke test when --url is provided
`);
}

function optionValue(name) {
  const index = process.argv.indexOf(name);

  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function normalizeUrl(raw) {
  if (!raw) {
    return undefined;
  }

  try {
    const url = new URL(raw);

    if (!["http:", "https:"].includes(url.protocol)) {
      return undefined;
    }

    url.pathname = url.pathname.replace(/\/+$/, "");
    url.search = "";
    url.hash = "";

    return url.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function runStep({ name, script, args = [] }) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${name}`);

    const child = spawn(npmCommand(), ["run", script, ...args], {
      stdio: "inherit",
      shell: false,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✓ ${name}`);
        resolve();
        return;
      }

      reject(new Error(`${name} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  usage();
  process.exit(0);
}

const rawSmokeUrl = optionValue("--url");
const smokeUrl = normalizeUrl(rawSmokeUrl);
const envFile = optionValue("--env-file");

if (rawSmokeUrl && !smokeUrl) {
  console.error(`Invalid --url value: ${rawSmokeUrl}`);
  process.exit(1);
}

const environmentArgs = envFile ? ["--", "--env-file", envFile] : [];

const steps = [
  {
    name: "Production beta environment",
    script: "beta:check-env:prod",
    args: environmentArgs,
  },
  {
    name: "TypeScript typecheck",
    script: "typecheck",
  },
  {
    name: "Lint",
    script: "lint",
  },
  {
    name: "Unit tests",
    script: "test",
  },
  {
    name: "Production build",
    script: "build",
  },
];

if (smokeUrl) {
  steps.push({
    name: "Deployed smoke test",
    script: "beta:smoke",
    args: ["--", "--url", smokeUrl],
  });
}

console.log("JISSEKI private beta release check");

try {
  for (const step of steps) {
    await runStep(step);
  }
} catch (error) {
  console.error(
    `\nRelease check stopped: ${
      error instanceof Error ? error.message : "unknown failure"
    }`,
  );
  process.exit(1);
}

if (!smokeUrl) {
  console.log("\nSkipped deployed smoke test because --url was not provided.");
}

console.log("\nAll requested release checks passed.");
