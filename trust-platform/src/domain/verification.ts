import { z } from "zod";

import { rehireResponses } from "./public-evidence";

const visibilitySchema = z.object({
  companyName: z.boolean().default(false),
  acquisitionSource: z.boolean().default(false),
  reviewerName: z.boolean().default(false),
  reviewerJobTitle: z.boolean().default(false),
  projectPeriod: z.boolean().default(false),
  outcomeStatement: z.boolean().default(false),
  outcomeMetric: z.boolean().default(false),
  reviewerComment: z.boolean().default(false),
  rehireResponse: z.boolean().default(false),
});

const verificationSchema = z
  .object({
    projectExisted: z.boolean(),
    sourceAccurate: z.boolean(),
    roleAccurate: z.boolean(),
    outcomeAccurate: z.boolean(),
    metricAccurate: z.boolean().nullable(),
    hasOutcomeMetric: z.boolean().default(false),
    rehireResponse: z.enum(rehireResponses).nullable(),
    sharingPreference: z.enum([
      "share_public_profile",
      "open_to_reference_request",
      "not_now",
    ]),
    openToReferenceRequests: z.boolean().default(false),
    reviewerName: z.string().trim().max(120).nullable(),
    reviewerJobTitle: z.string().trim().max(160).nullable(),
    reviewerComment: z.string().trim().max(1000).nullable(),
    visibility: visibilitySchema,
    consentConfirmed: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (!value.consentConfirmed) {
      ctx.addIssue({
        code: "custom",
        path: ["consentConfirmed"],
        message: "Explicit consent is required.",
      });
    }

    if (value.visibility.outcomeMetric && !value.hasOutcomeMetric) {
      ctx.addIssue({
        code: "custom",
        path: ["visibility", "outcomeMetric"],
        message: "Outcome metric cannot be public when no metric exists.",
      });
    }

    if (value.visibility.reviewerName && !value.reviewerName) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerName"],
        message: "Reviewer name is required when it is public.",
      });
    }

    if (value.visibility.reviewerJobTitle && !value.reviewerJobTitle) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerJobTitle"],
        message: "Reviewer job title is required when it is public.",
      });
    }

    if (value.visibility.reviewerComment && !value.reviewerComment) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerComment"],
        message: "Reviewer comment is required when it is public.",
      });
    }

    if (
      value.openToReferenceRequests &&
      value.sharingPreference === "not_now"
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["openToReferenceRequests"],
        message:
          "Reference requests cannot be enabled when this verification is not shareable.",
      });
    }
  });

export type ReviewerVerificationInput = z.infer<typeof verificationSchema>;

export function parseReviewerVerification(
  input: unknown,
): ReviewerVerificationInput {
  return verificationSchema.parse(input);
}

export function safeParseReviewerVerification(input: unknown) {
  return verificationSchema.safeParse(input);
}

export function verificationApprovesProject(
  input: ReviewerVerificationInput,
): boolean {
  return (
    input.projectExisted &&
    input.sourceAccurate &&
    input.roleAccurate &&
    input.outcomeAccurate &&
    input.metricAccurate !== false
  );
}
