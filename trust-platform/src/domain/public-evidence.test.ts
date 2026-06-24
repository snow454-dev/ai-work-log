import { describe, expect, it } from "vitest";

import { buildPublicEvidence } from "./public-evidence";

describe("buildPublicEvidence", () => {
  it("omits every private field without explicit reviewer consent", () => {
    const result = buildPublicEvidence({
      revision: {
        title: "Reporting automation",
        serviceCategory: "AI automation",
        acquisitionSource: "upwork",
        sourcePlatformLabel: null,
        companyName: "Secret Corp",
        projectStart: "2026-01-01",
        projectEnd: "2026-02-01",
        outcomeStatement: "Saved 18 hours",
        outcomeMetricValue: 18,
        outcomeMetricUnit: "hours/week",
      },
      verification: {
        reviewerName: "Alex",
        reviewerJobTitle: "COO",
        reviewerComment: "Excellent",
        rehireResponse: "yes",
        showCompanyName: false,
        showReviewerName: false,
        showReviewerJobTitle: false,
        showProjectPeriod: false,
        showOutcomeStatement: true,
        showOutcomeMetric: false,
        showReviewerComment: false,
        showRehireResponse: false,
        showAcquisitionSource: false,
      },
    });

    expect(result).toEqual({
      publicTitle: "Reporting automation",
      publicServiceCategory: "AI automation",
      verificationBadge: "company_domain_verified",
      publicOutcomeStatement: "Saved 18 hours",
      publicCompanyName: null,
      publicReviewerName: null,
      publicReviewerJobTitle: null,
      publicProjectStart: null,
      publicProjectEnd: null,
      publicOutcomeMetricValue: null,
      publicOutcomeMetricUnit: null,
      publicReviewerComment: null,
      publicRehireResponse: null,
      publicAcquisitionSource: null,
      publicSourcePlatformLabel: null,
    });
  });

  it("includes consented source platform fields for external-platform work", () => {
    const result = buildPublicEvidence({
      revision: {
        title: "Sales ops AI agent",
        serviceCategory: "AI consulting",
        acquisitionSource: "other_platform",
        sourcePlatformLabel: "Contra",
        companyName: "Acme Inc",
        projectStart: "2026-03-01",
        projectEnd: "2026-04-15",
        outcomeStatement: "Improved response quality",
        outcomeMetricValue: null,
        outcomeMetricUnit: null,
      },
      verification: {
        reviewerName: "Sam",
        reviewerJobTitle: "VP Operations",
        reviewerComment: "Would hire again.",
        rehireResponse: "yes",
        showCompanyName: true,
        showReviewerName: false,
        showReviewerJobTitle: false,
        showProjectPeriod: true,
        showOutcomeStatement: false,
        showOutcomeMetric: false,
        showReviewerComment: true,
        showRehireResponse: true,
        showAcquisitionSource: true,
      },
    });

    expect(result).toEqual({
      publicTitle: "Sales ops AI agent",
      publicServiceCategory: "AI consulting",
      verificationBadge: "company_domain_verified",
      publicCompanyName: "Acme Inc",
      publicReviewerName: null,
      publicReviewerJobTitle: null,
      publicProjectStart: "2026-03-01",
      publicProjectEnd: "2026-04-15",
      publicOutcomeStatement: null,
      publicOutcomeMetricValue: null,
      publicOutcomeMetricUnit: null,
      publicReviewerComment: "Would hire again.",
      publicRehireResponse: "yes",
      publicAcquisitionSource: "other_platform",
      publicSourcePlatformLabel: "Contra",
    });
  });
});
