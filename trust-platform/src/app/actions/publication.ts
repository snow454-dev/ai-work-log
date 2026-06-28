"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { publishVerifiedEvidenceForProject } from "@/data/publication";

export async function publishProjectEvidence(projectId: string) {
  let profileSlug: string;

  try {
    const result = await publishVerifiedEvidenceForProject(projectId);
    profileSlug = result.profileSlug;
  } catch {
    redirect(`/projects/${projectId}?publish=failed`);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/p/${profileSlug}`);
  redirect(`/p/${profileSlug}`);
}
