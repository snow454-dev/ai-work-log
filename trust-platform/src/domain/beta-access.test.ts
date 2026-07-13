import { describe, expect, it } from "vitest";

import {
  isEmailAllowedForBeta,
  parseBetaAllowedEmails,
} from "./beta-access";

describe("parseBetaAllowedEmails", () => {
  it("normalizes comma and newline separated emails", () => {
    expect(
      parseBetaAllowedEmails(" Alice@Example.com, bob@example.com\nalice@example.com "),
    ).toEqual(["alice@example.com", "bob@example.com"]);
  });

  it("returns an empty list when no allowlist is configured", () => {
    expect(parseBetaAllowedEmails("")).toEqual([]);
    expect(parseBetaAllowedEmails(undefined)).toEqual([]);
  });
});

describe("isEmailAllowedForBeta", () => {
  it("allows all emails when no allowlist is configured", () => {
    expect(
      isEmailAllowedForBeta({
        email: "new-user@example.com",
        allowedEmails: "",
      }),
    ).toBe(true);
  });

  it("allows only exact normalized matches when an allowlist exists", () => {
    expect(
      isEmailAllowedForBeta({
        email: "ALICE@example.com",
        allowedEmails: "alice@example.com,bob@example.com",
      }),
    ).toBe(true);

    expect(
      isEmailAllowedForBeta({
        email: "carol@example.com",
        allowedEmails: "alice@example.com,bob@example.com",
      }),
    ).toBe(false);
  });

  it("allows additional emails without replacing the primary allowlist", () => {
    expect(
      isEmailAllowedForBeta({
        email: "hello@aisupports.cc",
        allowedEmails: "alice@example.com",
        additionalAllowedEmails: "hello@aisupports.cc",
      }),
    ).toBe(true);

    expect(
      isEmailAllowedForBeta({
        email: "alice@example.com",
        allowedEmails: "alice@example.com",
        additionalAllowedEmails: "hello@aisupports.cc",
      }),
    ).toBe(true);
  });

  it("allows admin sign-in emails without granting admin authority in the app", () => {
    expect(
      isEmailAllowedForBeta({
        email: "hello@aisupports.cc",
        allowedEmails: "founder@example.com",
        adminAllowedEmails: "hello@aisupports.cc",
      }),
    ).toBe(true);
  });
});
