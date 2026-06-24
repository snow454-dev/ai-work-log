import { describe, expect, it } from "vitest";

import {
  normalizeDomain,
  parseProjectDraft,
  projectDraftContentHash,
} from "@/domain/project-draft";

const validDraft = {
  title: "Reporting automation",
  companyName: "Acme",
  companyWebsite: "https://acme.com",
  companyDomain: "acme.com",
  reviewerEmail: "ops@acme.com",
  acquisitionSource: "upwork",
  sourcePlatformLabel: "",
  serviceCategory: "AI automation",
  projectStart: "2026-01-01",
  projectEnd: "2026-02-01",
  roleDescription: "Built the reporting workflow",
  summary: "Automated weekly reporting across sales and finance",
  outcomeStatement: "Saved 18 hours per week",
  outcomeMetricValue: "18",
  outcomeMetricUnit: "hours/week",
};

describe("parseProjectDraft", () => {
  it("requires a matching company email domain", () => {
    expect(() =>
      parseProjectDraft({
        ...validDraft,
        reviewerEmail: "reviewer@gmail.com",
      }),
    ).toThrow("reviewer email must match the company domain");
  });

  it("rejects consumer email domains as company domains", () => {
    expect(() =>
      parseProjectDraft({
        ...validDraft,
        companyDomain: "gmail.com",
        reviewerEmail: "owner@gmail.com",
      }),
    ).toThrow("consumer email domain");
  });

  it("requires a source platform label only for other platforms", () => {
    expect(() =>
      parseProjectDraft({
        ...validDraft,
        acquisitionSource: "other_platform",
        sourcePlatformLabel: "",
      }),
    ).toThrow("source platform label is required");

    expect(() =>
      parseProjectDraft({
        ...validDraft,
        acquisitionSource: "upwork",
        sourcePlatformLabel: "Contra",
      }),
    ).toThrow("source platform label is only used");
  });

  it("normalizes domains, optional fields, and metric values", () => {
    expect(
      parseProjectDraft({
        ...validDraft,
        companyDomain: "https://www.acme.com/team",
        reviewerEmail: "ops@acme.com",
        outcomeMetricValue: "18.5",
      }),
    ).toMatchObject({
      companyDomain: "acme.com",
      sourcePlatformLabel: null,
      outcomeMetricValue: 18.5,
    });
  });

  it("creates the same content hash for equivalent drafts", () => {
    const first = parseProjectDraft(validDraft);
    const second = parseProjectDraft({
      ...validDraft,
      companyDomain: "www.acme.com",
      sourcePlatformLabel: "",
    });

    expect(projectDraftContentHash(first)).toBe(projectDraftContentHash(second));
  });
});

describe("normalizeDomain", () => {
  it("rejects invalid domains", () => {
    expect(() => normalizeDomain("localhost")).toThrow("valid domain");
  });
});
