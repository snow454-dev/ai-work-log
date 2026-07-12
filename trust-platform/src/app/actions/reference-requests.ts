"use server";

import { redirect } from "next/navigation";

import { getCurrentUserId } from "@/data/auth";
import { createReferenceRequest } from "@/data/reference-requests";
import { safeParseReferenceRequest } from "@/domain/reference-request";

export type ReferenceRequestActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

function optionalText(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function parseForm(formData: FormData): unknown {
  return {
    requesterName: formData.get("requesterName"),
    requesterEmail: formData.get("requesterEmail"),
    requesterCompany: formData.get("requesterCompany"),
    requesterRole: optionalText(formData, "requesterRole"),
    opportunityContext: formData.get("opportunityContext"),
    message: optionalText(formData, "message"),
    consentConfirmed: formData.get("consentConfirmed") === "on",
  };
}

export async function submitReferenceRequest(
  slug: string,
  evidenceId: string,
  _prevState: ReferenceRequestActionState,
  formData: FormData,
): Promise<ReferenceRequestActionState> {
  await getCurrentUserId();

  const parsed = safeParseReferenceRequest(parseForm(formData));

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the highlighted fields.",
    };
  }

  try {
    await createReferenceRequest({
      slug,
      evidenceId,
      input: parsed.data,
    });
  } catch {
    return {
      ok: false,
      message:
        "Unable to submit this request. The reference path may no longer be available.",
    };
  }

  redirect(`/p/${slug}/reference/${evidenceId}?submitted=1`);
}
