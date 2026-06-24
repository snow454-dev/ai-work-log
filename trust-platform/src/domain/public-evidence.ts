export const acquisitionSources = [
  "upwork",
  "sankaku",
  "other_platform",
  "referral",
  "direct",
  "other",
] as const;

export type AcquisitionSource = (typeof acquisitionSources)[number];

export const rehireResponses = ["yes", "maybe", "no"] as const;
export type RehireResponse = (typeof rehireResponses)[number];

export type VerificationBadge = "company_domain_verified";

export type PublicEvidenceRevision = {
  title: string;
  serviceCategory: string;
  acquisitionSource: AcquisitionSource;
  sourcePlatformLabel: string | null;
  companyName: string;
  projectStart: string | null;
  projectEnd: string | null;
  outcomeStatement: string;
  outcomeMetricValue: number | null;
  outcomeMetricUnit: string | null;
};

export type PublicEvidenceVerification = {
  reviewerName: string | null;
  reviewerJobTitle: string | null;
  reviewerComment: string | null;
  rehireResponse: RehireResponse | null;
  showCompanyName: boolean;
  showAcquisitionSource: boolean;
  showReviewerName: boolean;
  showReviewerJobTitle: boolean;
  showProjectPeriod: boolean;
  showOutcomeStatement: boolean;
  showOutcomeMetric: boolean;
  showReviewerComment: boolean;
  showRehireResponse: boolean;
};

export type BuildPublicEvidenceInput = {
  revision: PublicEvidenceRevision;
  verification: PublicEvidenceVerification;
};

export type PublicEvidence = {
  publicTitle: string;
  publicServiceCategory: string;
  verificationBadge: VerificationBadge;
  publicCompanyName: string | null;
  publicAcquisitionSource: AcquisitionSource | null;
  publicSourcePlatformLabel: string | null;
  publicProjectStart: string | null;
  publicProjectEnd: string | null;
  publicOutcomeStatement: string | null;
  publicOutcomeMetricValue: number | null;
  publicOutcomeMetricUnit: string | null;
  publicReviewerName: string | null;
  publicReviewerJobTitle: string | null;
  publicReviewerComment: string | null;
  publicRehireResponse: RehireResponse | null;
};

export function buildPublicEvidence({
  revision,
  verification,
}: BuildPublicEvidenceInput): PublicEvidence {
  return {
    publicTitle: revision.title,
    publicServiceCategory: revision.serviceCategory,
    verificationBadge: "company_domain_verified",
    publicCompanyName: verification.showCompanyName
      ? revision.companyName
      : null,
    publicAcquisitionSource: verification.showAcquisitionSource
      ? revision.acquisitionSource
      : null,
    publicSourcePlatformLabel: verification.showAcquisitionSource
      ? revision.sourcePlatformLabel
      : null,
    publicProjectStart: verification.showProjectPeriod
      ? revision.projectStart
      : null,
    publicProjectEnd: verification.showProjectPeriod ? revision.projectEnd : null,
    publicOutcomeStatement: verification.showOutcomeStatement
      ? revision.outcomeStatement
      : null,
    publicOutcomeMetricValue: verification.showOutcomeMetric
      ? revision.outcomeMetricValue
      : null,
    publicOutcomeMetricUnit: verification.showOutcomeMetric
      ? revision.outcomeMetricUnit
      : null,
    publicReviewerName: verification.showReviewerName
      ? verification.reviewerName
      : null,
    publicReviewerJobTitle: verification.showReviewerJobTitle
      ? verification.reviewerJobTitle
      : null,
    publicReviewerComment: verification.showReviewerComment
      ? verification.reviewerComment
      : null,
    publicRehireResponse: verification.showRehireResponse
      ? verification.rehireResponse
      : null,
  };
}
