"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/data/auth";
import {
  claimSingleReminder,
  createVerificationRequest,
  recordVerificationDelivery,
  revokeExpiredRequest,
  type VerificationRequestEmailContext,
} from "@/data/verification-requests";
import { getEmailTransport } from "@/lib/email";
import { verificationInvitation } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";

export type VerificationActionState = {
  ok: boolean;
  message: string;
  deliveryMode?: "email" | "manual";
  manualInvitationUrl?: string;
  reviewerEmail?: string;
  expiresAt?: string;
};

const INVITATION_TTL_HOURS = 72;

function expirationDate(): Date {
  return new Date(Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000);
}

function invitationUrl(requestId: string, token: string): string {
  return `${env.APP_URL}/verify/${requestId}?token=${encodeURIComponent(token)}`;
}

async function sendInvitationEmail({
  context,
  token,
  isReminder,
}: {
  context: VerificationRequestEmailContext;
  token: string;
  isReminder: boolean;
}) {
  return getEmailTransport().send(
    verificationInvitation({
      to: context.reviewerEmail,
      professionalName: context.professionalName,
      projectTitle: context.projectTitle,
      invitationUrl: invitationUrl(context.id, token),
      expiresAt: context.expiresAt,
      isReminder,
    }),
  );
}

async function persistThenSend({
  userId,
  token,
  context,
  isReminder,
}: {
  userId: string;
  token: string;
  context: VerificationRequestEmailContext;
  isReminder: boolean;
}): Promise<VerificationActionState> {
  if (process.env.MAIL_TRANSPORT === "manual") {
    return {
      ok: true,
      deliveryMode: "manual",
      manualInvitationUrl: invitationUrl(context.id, token),
      reviewerEmail: context.reviewerEmail,
      expiresAt: context.expiresAt,
      message:
        "Manual verification link created. Copy it and send it to the company reviewer through a trusted channel.",
    };
  }

  try {
    const delivery = await sendInvitationEmail({ context, token, isReminder });
    await recordVerificationDelivery({
      userId,
      requestId: context.id,
      eventType: "verification_request.delivery_succeeded",
      providerMessageId: delivery.id,
    });

    return {
      ok: true,
      message: isReminder
        ? "Reminder sent."
        : "Verification request sent to the company reviewer.",
    };
  } catch {
    await recordVerificationDelivery({
      userId,
      requestId: context.id,
      eventType: "verification_request.delivery_failed",
    });

    return {
      ok: false,
      message:
        "The request was saved, but the email could not be sent. Please try again.",
    };
  }
}

export async function sendVerificationRequest(
  projectId: string,
  formData?: FormData,
): Promise<VerificationActionState> {
  void formData;

  const userId = await getCurrentUserId();
  const token = createOpaqueToken();
  const context = await createVerificationRequest({
    userId,
    projectId,
    invitationTokenHash: hashOpaqueToken(token),
    expiresAt: expirationDate(),
  });

  const result = await persistThenSend({
    userId,
    token,
    context,
    isReminder: false,
  });
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  return result;
}

export async function sendVerificationRequestForm(
  projectId: string,
  formData: FormData,
): Promise<void> {
  await sendVerificationRequest(projectId, formData);
}

export async function sendVerificationRequestWithState(
  projectId: string,
  _prevState: VerificationActionState,
  formData: FormData,
): Promise<VerificationActionState> {
  return sendVerificationRequest(projectId, formData);
}

export async function sendVerificationReminder(
  requestId: string,
): Promise<VerificationActionState> {
  const userId = await getCurrentUserId();
  const token = createOpaqueToken();
  const context = await claimSingleReminder({
    userId,
    requestId,
    invitationTokenHash: hashOpaqueToken(token),
    expiresAt: expirationDate(),
  });

  return persistThenSend({
    userId,
    token,
    context,
    isReminder: true,
  });
}

export async function replaceExpiredVerificationRequest(
  projectId: string,
): Promise<VerificationActionState> {
  const userId = await getCurrentUserId();
  await revokeExpiredRequest({ userId, projectId });
  return sendVerificationRequest(projectId);
}
