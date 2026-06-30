import { describe, expect, it } from "vitest";

import { parseBetaAccessRequest } from "./beta-access-request";

const validRequest = {
  intent: "developer",
  requesterName: "Aiko Tanaka",
  workEmail: "AIKO@example.com",
  companyName: "Aiko AI Studio",
  role: "Founder",
  useCase: "I want to verify completed AI automation projects for sales.",
  sourcePath: "/ai-solutions",
  consentConfirmed: true,
};

describe("parseBetaAccessRequest", () => {
  it("normalizes optional fields and keeps valid beta intent", () => {
    expect(
      parseBetaAccessRequest({
        ...validRequest,
        companyName: "",
        role: " ",
      }),
    ).toMatchObject({
      intent: "developer",
      companyName: null,
      role: null,
      workEmail: "AIKO@example.com",
    });
  });

  it("requires a supported intent, email, use case, and consent", () => {
    expect(() =>
      parseBetaAccessRequest({
        ...validRequest,
        intent: "investor",
      }),
    ).toThrow("Choose how you want to use Proofboard");

    expect(() =>
      parseBetaAccessRequest({
        ...validRequest,
        workEmail: "not-an-email",
      }),
    ).toThrow("Use a valid work email");

    expect(() =>
      parseBetaAccessRequest({
        ...validRequest,
        useCase: "short",
      }),
    ).toThrow("Add a little more context");

    expect(() =>
      parseBetaAccessRequest({
        ...validRequest,
        consentConfirmed: false,
      }),
    ).toThrow("Confirm how this request will be handled");
  });
});
