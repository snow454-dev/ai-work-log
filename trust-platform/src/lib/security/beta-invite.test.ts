import { beforeEach, describe, expect, it } from "vitest";

import { hashBetaInviteEmail, normalizeInviteEmail } from "./beta-invite";

describe("beta invite email hashing", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "publishable_live";
    process.env.APP_URL = "https://jisseki.test";
    process.env.TOKEN_PEPPER = "0123456789abcdef0123456789abcdef";
    process.env.OTP_PEPPER = "abcdef0123456789abcdef0123456789";
    process.env.MAIL_TRANSPORT = "manual";
  });

  it("normalizes email addresses before hashing", () => {
    expect(normalizeInviteEmail("  Alice@Example.COM ")).toBe(
      "alice@example.com",
    );
    expect(hashBetaInviteEmail("Alice@Example.COM")).toBe(
      hashBetaInviteEmail(" alice@example.com "),
    );
  });

  it("creates a non-reversible 64 character hash", () => {
    const hash = hashBetaInviteEmail("alice@example.com");

    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("alice");
  });
});
