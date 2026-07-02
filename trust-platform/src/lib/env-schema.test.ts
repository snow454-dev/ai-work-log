import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env-schema";

describe("parseServerEnv", () => {
  it("rejects missing required runtime configuration", () => {
    expect(() =>
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toThrow("APP_URL");
  });

  it("accepts a complete local configuration", () => {
    expect(
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        APP_URL: "http://localhost:3000",
        TOKEN_PEPPER: "0123456789abcdef0123456789abcdef",
        OTP_PEPPER: "abcdef0123456789abcdef0123456789",
        MAIL_TRANSPORT: "smtp",
        SMTP_HOST: "127.0.0.1",
        SMTP_PORT: "54325",
        MAIL_FROM: "Trust Platform <no-reply@example.test>",
      }),
    ).toMatchObject({ MAIL_TRANSPORT: "smtp", SMTP_PORT: 54325 });
  });

  it("accepts manual beta link mode without sender configuration", () => {
    expect(
      parseServerEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable_live",
        APP_URL: "https://jisseki.test",
        TOKEN_PEPPER: "0123456789abcdef0123456789abcdef",
        OTP_PEPPER: "abcdef0123456789abcdef0123456789",
        MAIL_TRANSPORT: "manual",
      }),
    ).toMatchObject({ MAIL_TRANSPORT: "manual" });
  });
});
