"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  getAdminBetaAccessRequest,
  inviteAdminBetaAccessRequest,
  requireAdmin,
  updateAdminBetaAccessRequestStatus,
} from "@/data/admin-beta-access";
import { getEmailTransport } from "@/lib/email";
import { betaAccessInvitation } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { localizedHref, type Locale } from "@/lib/i18n";
import { hashBetaInviteEmail } from "@/lib/security/beta-invite";

const operationSchema = z.enum(["review", "invite", "decline", "close"]);
const actionSchema = z.object({
  requestId: z.uuid(),
  operation: operationSchema,
  locale: z.enum(["en", "ja"]),
});

export type AdminBetaAccessActionState = {
  ok: boolean;
  tone?: "success" | "warning" | "error";
  message?:
    | "reviewing"
    | "invited"
    | "invited-manual"
    | "invited-email-failed"
    | "declined"
    | "closed"
    | "invalid"
    | "failed";
  manualSignInUrl?: string;
};

function signInUrl(locale: Locale): string {
  return `${env.APP_URL}${localizedHref("/sign-in", locale)}`;
}

export async function manageAdminBetaAccessRequest(
  _prevState: AdminBetaAccessActionState,
  formData: FormData,
): Promise<AdminBetaAccessActionState> {
  const parsed = actionSchema.safeParse({
    requestId: formData.get("requestId"),
    operation: formData.get("operation"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return { ok: false, tone: "error", message: "invalid" };
  }

  try {
    await requireAdmin();

    if (parsed.data.operation === "invite") {
      const request = await getAdminBetaAccessRequest(parsed.data.requestId);
      await inviteAdminBetaAccessRequest(
        request.id,
        hashBetaInviteEmail(request.work_email),
      );
      revalidatePath("/admin");

      const invitationUrl = signInUrl(parsed.data.locale);

      if (env.MAIL_TRANSPORT === "manual") {
        return {
          ok: true,
          tone: "warning",
          message: "invited-manual",
          manualSignInUrl: invitationUrl,
        };
      }

      try {
        await getEmailTransport().send(
          betaAccessInvitation({
            to: request.work_email,
            requesterName: request.requester_name,
            signInUrl: invitationUrl,
          }),
        );
      } catch (error) {
        console.error("Beta access granted, but invitation email failed.", error);
        return {
          ok: true,
          tone: "warning",
          message: "invited-email-failed",
          manualSignInUrl: invitationUrl,
        };
      }

      return { ok: true, tone: "success", message: "invited" };
    }

    const statusByOperation = {
      review: "reviewing",
      decline: "declined",
      close: "closed",
    } as const;
    const status = statusByOperation[parsed.data.operation];
    await updateAdminBetaAccessRequestStatus(parsed.data.requestId, status);
    revalidatePath("/admin");

    return { ok: true, tone: "success", message: status };
  } catch (error) {
    console.error("Unable to update beta access request from admin.", error);
    return { ok: false, tone: "error", message: "failed" };
  }
}
