import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const publishResultSchema = z.object({
  evidence_id: z.uuid(),
  profile_slug: z.string(),
});

export type PublishVerifiedEvidenceResult = {
  evidenceId: string;
  profileSlug: string;
};

export async function publishVerifiedEvidenceForProject(
  projectId: string,
): Promise<PublishVerifiedEvidenceResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("publish_verified_evidence", {
    p_project_id: projectId,
  });

  if (error) {
    throw new Error("Unable to publish this verified proof yet.");
  }

  const [result] = z.array(publishResultSchema).parse(data);

  if (!result) {
    throw new Error("Unable to publish this verified proof yet.");
  }

  return {
    evidenceId: result.evidence_id,
    profileSlug: result.profile_slug,
  };
}
