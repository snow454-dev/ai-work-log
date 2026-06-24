import "server-only";

import { createHash } from "node:crypto";
import { z } from "zod";

import { getProjectForUser } from "@/data/projects";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

const verificationRequestContextSchema = z.object({
  id: z.uuid(),
  reviewer_email: z.email(),
  professional_name: z.string().min(1),
  project_title: z.string().min(1),
  expires_at: z.string(),
});

export type VerificationRequestEmailContext = {
  id: string;
  reviewerEmail: string;
  professionalName: string;
  projectTitle: string;
  expiresAt: string;
};

export type DeliveryEventType =
  | "verification_request.delivery_succeeded"
  | "verification_request.delivery_failed";

function toEmailContext(input: unknown): VerificationRequestEmailContext {
  const parsed = verificationRequestContextSchema.parse(input);

  return {
    id: parsed.id,
    reviewerEmail: parsed.reviewer_email,
    professionalName: parsed.professional_name,
    projectTitle: parsed.project_title,
    expiresAt: parsed.expires_at,
  };
}

function hashReviewerEmail(email: string): string {
  return createHash("sha256")
    .update(`${env.TOKEN_PEPPER}:reviewer-email:${email.toLowerCase()}`)
    .digest("hex");
}

export async function createVerificationRequest({
  userId,
  projectId,
  invitationTokenHash,
  expiresAt,
}: {
  userId: string;
  projectId: string;
  invitationTokenHash: string;
  expiresAt: Date;
}): Promise<VerificationRequestEmailContext> {
  const project = await getProjectForUser({ userId, projectId });

  if (!project?.reviewerEmail) {
    throw new Error("PROJECT_REVIEWER_EMAIL_REQUIRED");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_verification_request", {
    p_project_id: projectId,
    p_invitation_token_hash: invitationTokenHash,
    p_reviewer_email_normalized_hash: hashReviewerEmail(project.reviewerEmail),
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error("Unable to create verification request.");
  }

  return toEmailContext(z.array(verificationRequestContextSchema).parse(data)[0]);
}

export async function recordVerificationDelivery({
  requestId,
  eventType,
  providerMessageId,
}: {
  userId: string;
  requestId: string;
  eventType: DeliveryEventType;
  providerMessageId?: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_verification_delivery", {
    p_request_id: requestId,
    p_event_type: eventType,
    p_provider_message_id: providerMessageId ?? null,
  });

  if (error) {
    throw new Error("Unable to record verification delivery.");
  }
}

export async function claimSingleReminder({
  requestId,
  invitationTokenHash,
  expiresAt,
}: {
  userId: string;
  requestId: string;
  invitationTokenHash: string;
  expiresAt: Date;
}): Promise<VerificationRequestEmailContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_single_reminder", {
    p_request_id: requestId,
    p_invitation_token_hash: invitationTokenHash,
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error("REMINDER_NOT_AVAILABLE");
  }

  return toEmailContext(z.array(verificationRequestContextSchema).parse(data)[0]);
}

export async function revokeExpiredRequest({
  projectId,
}: {
  userId: string;
  projectId: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_expired_verification_request", {
    p_project_id: projectId,
  });

  if (error) {
    throw new Error("NO_EXPIRED_REQUEST");
  }
}
