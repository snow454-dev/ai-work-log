import { describe, expect, it } from "vitest";

import {
  parseReviewerVerification,
  verificationApprovesProject,
} from "./verification";

const validInput = {
  projectExisted: true,
  sourceAccurate: true,
  roleAccurate: true,
  outcomeAccurate: true,
  metricAccurate: true,
  hasOutcomeMetric: true,
  rehireResponse: "yes",
  sharingPreference: "share_public_profile",
  reviewerName: "Alex",
  reviewerJobTitle: "COO",
  reviewerComment: "Excellent work.",
  consentConfirmed: true,
  visibility: {
    companyName: true,
    acquisitionSource: true,
    reviewerName: true,
    reviewerJobTitle: true,
    projectPeriod: true,
    outcomeStatement: true,
    outcomeMetric: true,
    reviewerComment: true,
    rehireResponse: true,
  },
} as const;

describe("Reviewer verification input", () => {
  it("declines when the project did not exist", () => {
    const parsed = parseReviewerVerification({
      ...validInput,
      projectExisted: false,
    });

    expect(verificationApprovesProject(parsed)).toBe(false);
  });

  it("rejects metric visibility when no metric exists", () => {
    expect(() =>
      parseReviewerVerification({
        ...validInput,
        hasOutcomeMetric: false,
      }),
    ).toThrow("Outcome metric cannot be public");
  });

  it("requires reviewer name and title when those fields are public", () => {
    expect(() =>
      parseReviewerVerification({
        ...validInput,
        reviewerName: null,
      }),
    ).toThrow("Reviewer name is required");

    expect(() =>
      parseReviewerVerification({
        ...validInput,
        reviewerJobTitle: null,
      }),
    ).toThrow("Reviewer job title is required");
  });

  it("requires explicit consent before submission", () => {
    expect(() =>
      parseReviewerVerification({
        ...validInput,
        consentConfirmed: false,
      }),
    ).toThrow("Explicit consent is required");
  });
});
