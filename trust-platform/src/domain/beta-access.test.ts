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
});
