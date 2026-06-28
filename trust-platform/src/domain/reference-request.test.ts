import { describe, expect, it } from "vitest";

import { parseReferenceRequest } from "./reference-request";

const validInput = {
  requesterName: "Mina Patel",
  requesterEmail: "mina@example.com",
  requesterCompany: "Future Works",
  requesterRole: "Head of Ops",
  opportunityContext: "We are evaluating an AI automation project.",
  message: "Could you share how the previous work went?",
  consentConfirmed: true,
} as const;

describe("reference request input", () => {
  it("parses a valid structured reference request", () => {
    expect(parseReferenceRequest(validInput)).toEqual(validInput);
  });

  it("requires a valid email and context", () => {
    expect(() =>
      parseReferenceRequest({
        ...validInput,
        requesterEmail: "not-an-email",
      }),
    ).toThrow("Use a valid work email");

    expect(() =>
      parseReferenceRequest({
        ...validInput,
        opportunityContext: "short",
      }),
    ).toThrow("Add a little more context");
  });

  it("requires handling consent", () => {
    expect(() =>
      parseReferenceRequest({
        ...validInput,
        consentConfirmed: false,
      }),
    ).toThrow("Confirm how this request will be handled");
  });
});
