import "server-only";

import { z } from "zod";

import type { ReviewerVerificationInput } from "@/domain/verification";
import { createClient } from "@/lib/supabase/server";

const reviewContextSchema = z.object({
  request_id: z.uuid(),
  project_revision_id: z.uuid(),
  reviewer_email: z.email(),
  project_title: z.string(),
  company_name: z.string(),
  acquisition_source: z.enum([
    "upwork",
    "sankaku",
    "other_platform",
    "referral",
    "direct",
    "other",
  ]),
  source_platform_label: z.string().nullable(),
  service_category: z.string(),
  project_start: z.string().nullable(),
  project_end: z.string().nullable(),
  role_description: z.string(),
  summary: z.string(),
  outcome_statement: z.string(),
  outcome_metric_value: z.number().nullable(),
  outcome_metric_unit: z.string().nullable(),
});

const submitResultSchema = z.object({
  verification_id: z.uuid(),
  status: z.enum(["verified", "declined"]),
});

export type ReviewContext = {
  requestId: string;
  projectRevisionId: string;
  reviewerEmail: string;
  projectTitle: string;
  companyName: string;
  acquisitionSource: z.infer<typeof reviewContextSchema>["acquisition_source"];
  sourcePlatformLabel: string | null;
  serviceCategory: string;
  projectStart: string | null;
  projectEnd: string | null;
  roleDescription: string;
  summary: string;
  outcomeStatement: string;
  outcomeMetricValue: number | null;
  outcomeMetricUnit: string | null;
};

export type SubmitVerificationResult = {
  verificationId: string;
  status: "verified" | "declined";
};

function toReviewContext(input: unknown): ReviewContext {
  const parsed = reviewContextSchema.parse(input);

  return {
    requestId: parsed.request_id,
    projectRevisionId: parsed.project_revision_id,
    reviewerEmail: parsed.reviewer_email,
    projectTitle: parsed.project_title,
    companyName: parsed.company_name,
    acquisitionSource: parsed.acquisition_source,
    sourcePlatformLabel: parsed.source_platform_label,
    serviceCategory: parsed.service_category,
    projectStart: parsed.project_start,
    projectEnd: parsed.project_end,
    roleDescription: parsed.role_description,
    summary: parsed.summary,
    outcomeStatement: parsed.outcome_statement,
    outcomeMetricValue: parsed.outcome_metric_value,
    outcomeMetricUnit: parsed.outcome_metric_unit,
  };
}

export async function getReviewerReviewContext({
  requestId,
  sessionHash,
}: {
  requestId: string;
  sessionHash: string;
}): Promise<ReviewContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_reviewer_review_context", {
    p_request_id: requestId,
    p_session_hash: sessionHash,
  });

  if (error) {
    throw new Error("Unable to load review context.");
  }

  const rows = z.array(reviewContextSchema).parse(data);
  return rows[0] ? toReviewContext(rows[0]) : null;
}

export async function submitVerification({
  requestId,
  sessionHash,
  input,
  receiptTokenHash,
}: {
  requestId: string;
  sessionHash: string;
  input: ReviewerVerificationInput;
  receiptTokenHash: string;
}): Promise<SubmitVerificationResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_verification", {
    p_request_id: requestId,
    p_session_hash: sessionHash,
    p_project_existed: input.projectExisted,
    p_source_accurate: input.sourceAccurate,
    p_role_accurate: input.roleAccurate,
    p_outcome_accurate: input.outcomeAccurate,
    p_metric_accurate: input.metricAccurate,
    p_rehire_response: input.rehireResponse,
    p_sharing_preference: input.sharingPreference,
    p_open_to_reference_requests: input.openToReferenceRequests,
    p_reviewer_name: input.reviewerName,
    p_reviewer_job_title: input.reviewerJobTitle,
    p_reviewer_comment: input.reviewerComment,
    p_show_company_name: input.visibility.companyName,
    p_show_acquisition_source: input.visibility.acquisitionSource,
    p_show_reviewer_name: input.visibility.reviewerName,
    p_show_reviewer_job_title: input.visibility.reviewerJobTitle,
    p_show_project_period: input.visibility.projectPeriod,
    p_show_outcome_statement: input.visibility.outcomeStatement,
    p_show_outcome_metric: input.visibility.outcomeMetric,
    p_show_reviewer_comment: input.visibility.reviewerComment,
    p_show_rehire_response: input.visibility.rehireResponse,
    p_receipt_token_hash: receiptTokenHash,
  });

  if (error) {
    throw new Error("Unable to submit verification.");
  }

  const parsed = submitResultSchema.parse(z.array(submitResultSchema).parse(data)[0]);
  return {
    verificationId: parsed.verification_id,
    status: parsed.status,
  };
}
