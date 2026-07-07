import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET } from "./route";

const originalEnv = { ...process.env };

function setCompleteEnv(overrides: Record<string, string | undefined> = {}) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable_live";
  process.env.APP_URL = "https://jisseki.test";
  process.env.TOKEN_PEPPER = "0123456789abcdef0123456789abcdef";
  process.env.OTP_PEPPER = "abcdef0123456789abcdef0123456789";
  process.env.MAIL_TRANSPORT = "resend";
  process.env.RESEND_API_KEY = "re_test_123";
  process.env.MAIL_FROM = "JISSEKI <no-reply@jisseki.test>";
  delete process.env.BETA_ALLOWED_EMAILS;
  delete process.env.BETA_ADDITIONAL_ALLOWED_EMAILS;

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe("/api/health", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("fails safely when required configuration is missing", async () => {
    process.env = { NODE_ENV: "test" };

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.checks.configuration.ok).toBe(false);
    expect(body.checks.configuration.missingOrInvalid).toContain("APP_URL");
  });

  it("reports conditional Resend configuration even when other required values are missing", async () => {
    process.env = {
      NODE_ENV: "production",
      MAIL_TRANSPORT: "resend",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable_live",
      APP_URL: "https://jisseki.test",
      TOKEN_PEPPER: "0123456789abcdef0123456789abcdef",
      OTP_PEPPER: "abcdef0123456789abcdef0123456789",
    };

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.checks.configuration.missingOrInvalid).toEqual(
      expect.arrayContaining(["MAIL_FROM", "RESEND_API_KEY"]),
    );
    expect(body.checks.configuration.missingOrInvalid).not.toContain(
      "SUPABASE_SECRET_KEY",
    );
  });

  it("reports beta allowlist independently from incomplete mail configuration", async () => {
    process.env = {
      NODE_ENV: "production",
      VERCEL_ENV: "production",
      MAIL_TRANSPORT: "resend",
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable_live",
      APP_URL: "https://jisseki.test",
      TOKEN_PEPPER: "0123456789abcdef0123456789abcdef",
      OTP_PEPPER: "abcdef0123456789abcdef0123456789",
      BETA_ALLOWED_EMAILS: "founder@jisseki.test",
    };

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.checks.configuration.ok).toBe(false);
    expect(body.checks.betaAccess).toEqual({
      ok: true,
      required: true,
      allowlistConfigured: true,
    });
  });

  it("requires the beta allowlist outside development and test", async () => {
    setCompleteEnv({ VERCEL_ENV: "production" });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.checks.betaAccess).toEqual({
      ok: false,
      required: true,
      allowlistConfigured: false,
    });
  });

  it("passes when production beta configuration includes an allowlist", async () => {
    setCompleteEnv({
      VERCEL_ENV: "production",
      BETA_ALLOWED_EMAILS: "founder@jisseki.test",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.checks.betaAccess).toEqual({
      ok: true,
      required: true,
      allowlistConfigured: true,
    });
  });

  it("passes when production beta configuration uses the additive allowlist", async () => {
    setCompleteEnv({
      VERCEL_ENV: "production",
      BETA_ADDITIONAL_ALLOWED_EMAILS: "hello@aisupports.cc",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.checks.betaAccess).toEqual({
      ok: true,
      required: true,
      allowlistConfigured: true,
    });
  });

  it("passes production health in manual beta link mode without email provider secrets", async () => {
    setCompleteEnv({
      VERCEL_ENV: "production",
      MAIL_TRANSPORT: "manual",
      RESEND_API_KEY: undefined,
      MAIL_FROM: undefined,
      BETA_ALLOWED_EMAILS: "founder@jisseki.test",
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.checks.configuration).toMatchObject({
      ok: true,
      mailTransport: "manual",
    });
  });
});
