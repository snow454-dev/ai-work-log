"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/data/auth";
import { insertProjectWithRevision } from "@/data/projects";
import { safeParseProjectDraft } from "@/domain/project-draft";

export type ProjectActionState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function createProject(
  _prevState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = safeParseProjectDraft(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the highlighted fields.",
    };
  }

  let projectId: string;

  try {
    const userId = await getCurrentUserId();
    const project = await insertProjectWithRevision({
      userId,
      input: parsed.data,
    });
    projectId = project.id;
  } catch {
    return { message: "Unable to create this project draft." };
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}`);
}
