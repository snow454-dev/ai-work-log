"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/data/auth";
import { upsertProfileForUser } from "@/data/profiles";
import { safeParseProfile } from "@/domain/profile";

export type ProfileActionState = {
  errors?: Record<string, string[] | undefined>;
  message?: string;
};

export async function saveProfile(
  _prevState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const parsed = safeParseProfile(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the highlighted fields.",
    };
  }

  try {
    const userId = await getCurrentUserId();
    await upsertProfileForUser({ userId, input: parsed.data });
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Unable to save profile.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
