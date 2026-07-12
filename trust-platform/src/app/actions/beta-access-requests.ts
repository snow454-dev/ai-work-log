"use server";

import { redirect } from "next/navigation";

import { createBetaAccessRequest } from "@/data/beta-access-requests";
import {
  safeParseBetaAccessRequest,
  type BetaAccessRequestInput,
  type BetaAccessIntent,
} from "@/domain/beta-access-request";
import { getEmailTransport } from "@/lib/email";
import { betaAccessRequestNotification } from "@/lib/email/templates";
import { localizedHref, type Locale } from "@/lib/i18n";

export type BetaAccessRequestActionState = {
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
    intent: formData.get("intent"),
    requesterName: formData.get("requesterName"),
    workEmail: formData.get("workEmail"),
    companyName: optionalText(formData, "companyName"),
    role: optionalText(formData, "role"),
    useCase: formData.get("useCase"),
    sourcePath: optionalText(formData, "sourcePath"),
    consentConfirmed: formData.get("consentConfirmed") === "on",
  };
}

async function notifyBetaAccessRequest(
  input: BetaAccessRequestInput,
  requestId: string,
): Promise<void> {
  const notifyEmail = process.env.BETA_ACCESS_NOTIFY_EMAIL?.trim();

  if (!notifyEmail) {
    return;
  }

  try {
    await getEmailTransport().send(
      betaAccessRequestNotification({
        to: notifyEmail,
        requestId,
        intent: input.intent,
        requesterName: input.requesterName,
        workEmail: input.workEmail,
        companyName: input.companyName,
        role: input.role,
        useCase: input.useCase,
        sourcePath: input.sourcePath,
      }),
    );
  } catch (error) {
    console.error("Unable to send beta access notification.", error);
  }
}

export async function submitBetaAccessRequest(
  locale: Locale,
  _prevState: BetaAccessRequestActionState,
  formData: FormData,
): Promise<BetaAccessRequestActionState> {
  const parsed = safeParseBetaAccessRequest(parseForm(formData));

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the highlighted fields.",
    };
  }

  try {
    const created = await createBetaAccessRequest(parsed.data);
    await notifyBetaAccessRequest(parsed.data, created.id);
  } catch {
    return {
      ok: false,
      message:
        "Unable to submit this request. Please try again or use an invited email if you already have access.",
    };
  }

  const intent = encodeURIComponent(parsed.data.intent satisfies BetaAccessIntent);
  redirect(localizedHref(`/beta-access?intent=${intent}&submitted=1`, locale));
}
