#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const mode = process.argv.includes("--production") ? "production" : "local";
const root = process.cwd();

function parseDotEnv(source) {
  const values = {};

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function loadEnvFile(name) {
  const filePath = path.join(root, name);

  if (!existsSync(filePath)) {
    return {};
  }

  return parseDotEnv(readFileSync(filePath, "utf8"));
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...process.env,
};

const checks = [];

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
}

function value(name) {
  const current = env[name];

  return typeof current === "string" ? current.trim() : "";
}

function has(name) {
  return value(name).length > 0;
}

function isPlaceholder(current) {
  return /replace-with|changeme|\bYOUR[-_A-Z0-9]*\b|example(\.|>|$)|sb_(publishable|secret)_test/i.test(current);
}

function isLocalUrl(current) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(
    current,
  );
}

function isHttpsUrl(current) {
  try {
    return new URL(current).protocol === "https:";
  } catch {
    return false;
  }
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "APP_URL",
  "TOKEN_PEPPER",
  "OTP_PEPPER",
  "MAIL_TRANSPORT",
  "MAIL_FROM",
];

const missing = required.filter((name) => !has(name));
addCheck(
  "required variables are present",
  missing.length === 0,
  missing.length ? `Missing: ${missing.join(", ")}` : undefined,
);

const placeholderVariables = required.filter((name) =>
  isPlaceholder(value(name)),
);
addCheck(
  "placeholder values are removed",
  placeholderVariables.length === 0,
  placeholderVariables.length
    ? `Replace placeholder values for: ${placeholderVariables.join(", ")}`
    : undefined,
);

addCheck(
  "TOKEN_PEPPER is at least 32 characters",
  value("TOKEN_PEPPER").length >= 32 && !isPlaceholder(value("TOKEN_PEPPER")),
  "Use a unique random secret for TOKEN_PEPPER.",
);

addCheck(
  "OTP_PEPPER is at least 32 characters",
  value("OTP_PEPPER").length >= 32 && !isPlaceholder(value("OTP_PEPPER")),
  "Use a unique random secret for OTP_PEPPER.",
);

addCheck(
  "TOKEN_PEPPER and OTP_PEPPER differ",
  value("TOKEN_PEPPER") !== value("OTP_PEPPER"),
  "Use separate random secrets for token hashing and OTP hashing.",
);

const mailTransport = value("MAIL_TRANSPORT");

if (mailTransport === "smtp") {
  const smtpMissing = ["SMTP_HOST", "SMTP_PORT"].filter((name) => !has(name));
  addCheck(
    "SMTP transport has host and port",
    smtpMissing.length === 0,
    smtpMissing.length ? `Missing: ${smtpMissing.join(", ")}` : undefined,
  );
} else if (mailTransport === "resend") {
  addCheck(
    "Resend transport has API key",
    has("RESEND_API_KEY") && !isPlaceholder(value("RESEND_API_KEY")),
    "Set RESEND_API_KEY for production transactional email.",
  );
} else {
  addCheck(
    "mail transport is valid",
    false,
    "MAIL_TRANSPORT must be either smtp or resend.",
  );
}

if (mode === "production") {
  addCheck(
    "APP_URL is HTTPS in production",
    isHttpsUrl(value("APP_URL")) && !isLocalUrl(value("APP_URL")),
    "APP_URL must be the deployed https URL.",
  );

  addCheck(
    "Supabase URL is not local in production",
    has("NEXT_PUBLIC_SUPABASE_URL") &&
      !isLocalUrl(value("NEXT_PUBLIC_SUPABASE_URL")),
    "Use the hosted Supabase project URL, not localhost.",
  );

  addCheck(
    "production email uses Resend",
    mailTransport === "resend",
    "Use MAIL_TRANSPORT=resend before inviting external company reviewers.",
  );

  addCheck(
    "MAIL_FROM is production-ready",
    has("MAIL_FROM") &&
      !/example|localhost|\bYOUR[-_A-Z0-9]*\b/i.test(value("MAIL_FROM")),
    "Use a verified sender domain, e.g. Proofboard <no-reply@yourdomain.com>.",
  );
}

console.log(`Proofboard beta environment check (${mode})`);

for (const check of checks) {
  const mark = check.ok ? "✓" : "✗";
  console.log(`${mark} ${check.name}`);

  if (!check.ok && check.detail) {
    console.log(`  ${check.detail}`);
  }
}

const failed = checks.filter((check) => !check.ok);

if (failed.length > 0) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}

console.log("\nAll checks passed.");
