import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const verificationIdSchema = z.uuid();

const verificationReceiptRowSchema = z.object({
  id: z.uuid(),
  verification_request_id: z.uuid(),
  project_title: z.string(),
  company_name: z.string(),
  service_category: z.string(),
  reviewer_email: z.email(),
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

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_verification_receipt", {
    p_verification_id: parsedVerificationId.data,
    p_receipt_token_hash: receiptTokenHash,
  });

  if (error) {
    throw new Error("Unable to load verification receipt.");
  }

  const [receipt] = z.array(verificationReceiptRowSchema).parse(data);

  if (!receipt) {
    return null;
  }

  return {
    id: receipt.id,
    projectTitle: receipt.project_title,
    companyName: receipt.company_name,
    serviceCategory: receipt.service_category,
    reviewerEmail: receipt.reviewer_email,
    companyDomainVerified: receipt.company_domain_verified,
    consentStatus: receipt.consent_status,
    sharingPreference: receipt.sharing_preference,
    openToReferenceRequests: receipt.open_to_reference_requests,
    submittedAt: receipt.submitted_at,
    withdrawnAt: receipt.withdrawn_at,
    disputedAt: receipt.disputed_at,
  };
}
