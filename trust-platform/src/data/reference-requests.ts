import "server-only";

import { z } from "zod";

import type { ReferenceRequestInput } from "@/domain/reference-request";
import { createClient } from "@/lib/supabase/server";

const createReferenceRequestResultSchema = z.object({
  reference_request_id: z.uuid(),
});

const referenceRequestRowSchema = z.object({
  reference_request_id: z.uuid(),
  published_evidence_id: z.uuid(),
  public_title: z.string(),
  requester_name: z.string(),
  requester_email: z.email(),
  requester_company: z.string(),
  requester_role: z.string().nullable(),
  opportunity_context: z.string(),
  message: z.string().nullable(),
  status: z.enum(["pending", "accepted", "declined", "expired"]),
  created_at: z.string(),
});

export type CreatedReferenceRequest = {
  id: string;
};

export type ReferenceRequestListItem = {
  id: string;
  evidenceId: string;
  publicTitle: string;
  requesterName: string;
  requesterEmail: string;
  requesterCompany: string;
  requesterRole: string | null;
  opportunityContext: string;
  message: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
};

export async function createReferenceRequest({
  slug,
  evidenceId,
  input,
}: {
  slug: string;
  evidenceId: string;
  input: ReferenceRequestInput;
}): Promise<CreatedReferenceRequest> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_reference_request", {
    p_slug: slug,
    p_evidence_id: evidenceId,
    p_requester_name: input.requesterName,
    p_requester_email: input.requesterEmail,
    p_requester_company: input.requesterCompany,
    p_requester_role: input.requesterRole,
    p_opportunity_context: input.opportunityContext,
    p_message: input.message,
  });

  if (error) {
    throw new Error("Unable to create reference request.");
  }

  const [result] = z.array(createReferenceRequestResultSchema).parse(data);

  if (!result) {
    throw new Error("Unable to create reference request.");
  }

  return { id: result.reference_request_id };
}

export async function listReferenceRequestsForOwner(): Promise<
  ReferenceRequestListItem[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "list_reference_requests_for_owner",
  );

  if (error) {
    throw new Error("Unable to load reference requests.");
  }

  return z
    .array(referenceRequestRowSchema)
    .parse(data)
    .map((row) => ({
      id: row.reference_request_id,
      evidenceId: row.published_evidence_id,
      publicTitle: row.public_title,
      requesterName: row.requester_name,
      requesterEmail: row.requester_email,
      requesterCompany: row.requester_company,
      requesterRole: row.requester_role,
      opportunityContext: row.opportunity_context,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
    }));
}
