import "server-only";

import { z } from "zod";

import type { BetaAccessRequestInput } from "@/domain/beta-access-request";
import { createClient } from "@/lib/supabase/server";

const createBetaAccessRequestResultSchema = z.object({
  beta_access_request_id: z.uuid(),
});

export type CreatedBetaAccessRequest = {
  id: string;
};

export async function createBetaAccessRequest(
  input: BetaAccessRequestInput,
): Promise<CreatedBetaAccessRequest> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_beta_access_request", {
    p_intent: input.intent,
    p_requester_name: input.requesterName,
    p_work_email: input.workEmail,
    p_company_name: input.companyName,
    p_role: input.role,
    p_use_case: input.useCase,
    p_source_path: input.sourcePath,
  });

  if (error) {
    throw new Error("Unable to create beta access request.");
  }

  const [result] = z.array(createBetaAccessRequestResultSchema).parse(data);

  if (!result) {
    throw new Error("Unable to create beta access request.");
  }

  return { id: result.beta_access_request_id };
}
