import "server-only";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const verificationIdSchema = z.uuid();

const verificationRowSchema = z.object({
  id: z.uuid(),
  verification_request_id: z.uuid(),
  company_domain_verified: z.boolean(),
  consent_status: z.enum(["active", "withdrawn", "disputed"]),
  sharing_preference: z.enum([
    "share_public_profile",
    "open_to_reference_request",
    "not_now",
  ]),
  open_to_reference_requests: z.boolean(),
  submitted_at: z.string(),
  withdrawn_at: z.string().nullable(),
  disputed_at: z.string().nullable(),
});

const requestRowSchema = z.object({
  reviewer_email: z.email(),
  project_revision_id: z.uuid(),
});

const revisionRowSchema = z.object({
  title: z.string(),
  company_name: z.string(),
  service_category: z.string(),
});

export type VerificationReceipt = {
  id: string;
  projectTitle: string;
  companyName: string;
  serviceCategory: string;
  reviewerEmail: string;
  companyDomainVerified: boolean;
  consentStatus: "active" | "withdrawn" | "disputed";
  sharingPreference:
    | "share_public_profile"
    | "open_to_reference_request"
    | "not_now";
  openToReferenceRequests: boolean;
  submittedAt: string;
  withdrawnAt: string | null;
  disputedAt: string | null;
};

export async function getVerificationReceiptByToken({
  verificationId,
  receiptTokenHash,
}: {
  verificationId: string;
  receiptTokenHash: string;
}): Promise<VerificationReceipt | null> {
  const parsedVerificationId = verificationIdSchema.safeParse(verificationId);

  if (!parsedVerificationId.success) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: verificationData, error: verificationError } = await supabase
    .from("verifications")
    .select(
      [
        "id",
        "verification_request_id",
        "company_domain_verified",
        "consent_status",
        "sharing_preference",
        "open_to_reference_requests",
        "submitted_at",
        "withdrawn_at",
        "disputed_at",
      ].join(","),
    )
    .eq("id", parsedVerificationId.data)
    .eq("reviewer_receipt_token_hash", receiptTokenHash)
    .maybeSingle();

  if (verificationError) {
    throw new Error("Unable to load verification receipt.");
  }

  if (!verificationData) {
    return null;
  }

  const verification = verificationRowSchema.parse(verificationData);

  const { data: requestData, error: requestError } = await supabase
    .from("verification_requests")
    .select("reviewer_email,project_revision_id")
    .eq("id", verification.verification_request_id)
    .maybeSingle();

  if (requestError) {
    throw new Error("Unable to load verification receipt request.");
  }

  if (!requestData) {
    return null;
  }

  const request = requestRowSchema.parse(requestData);

  const { data: revisionData, error: revisionError } = await supabase
    .from("project_revisions")
    .select("title,company_name,service_category")
    .eq("id", request.project_revision_id)
    .maybeSingle();

  if (revisionError) {
    throw new Error("Unable to load verification receipt project.");
  }

  if (!revisionData) {
    return null;
  }

  const revision = revisionRowSchema.parse(revisionData);

  return {
    id: verification.id,
    projectTitle: revision.title,
    companyName: revision.company_name,
    serviceCategory: revision.service_category,
    reviewerEmail: request.reviewer_email,
    companyDomainVerified: verification.company_domain_verified,
    consentStatus: verification.consent_status,
    sharingPreference: verification.sharing_preference,
    openToReferenceRequests: verification.open_to_reference_requests,
    submittedAt: verification.submitted_at,
    withdrawnAt: verification.withdrawn_at,
    disputedAt: verification.disputed_at,
  };
}
