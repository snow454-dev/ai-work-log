import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const reviewerInvitationSchema = z.object({
  id: z.uuid(),
  reviewer_email: z.email(),
  professional_name: z.string().min(1),
  project_title: z.string().min(1),
  expires_at: z.string(),
});

const reviewerSessionSchema = z.object({
  session_id: z.uuid(),
  expires_at: z.string(),
});

export type ReviewerInvitation = {
  id: string;
  reviewerEmail: string;
  professionalName: string;
  projectTitle: string;
  expiresAt: string;
};

export type ReviewerSession = {
  sessionId: string;
  expiresAt: string;
};

export function reviewerSessionCookieName(requestId: string): string {
  return `vrp_review_${requestId}`;
}

function toInvitation(input: unknown): ReviewerInvitation {
  const parsed = reviewerInvitationSchema.parse(input);

  return {
    id: parsed.id,
    reviewerEmail: parsed.reviewer_email,
    professionalName: parsed.professional_name,
    projectTitle: parsed.project_title,
    expiresAt: parsed.expires_at,
  };
}

function toReviewerSession(input: unknown): ReviewerSession {
  const parsed = reviewerSessionSchema.parse(input);

  return {
    sessionId: parsed.session_id,
    expiresAt: parsed.expires_at,
  };
}

export async function openReviewerInvitation({
  requestId,
  invitationTokenHash,
}: {
  requestId: string;
  invitationTokenHash: string;
}): Promise<ReviewerInvitation> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("mark_verification_viewed", {
    p_request_id: requestId,
    p_invitation_hash: invitationTokenHash,
  });

  if (error) {
    throw new Error("INVALID_INVITATION");
  }

  return toInvitation(z.array(reviewerInvitationSchema).parse(data)[0]);
}

export async function setReviewerOtp({
  requestId,
  invitationTokenHash,
  otpHash,
  otpExpiresAt,
}: {
  requestId: string;
  invitationTokenHash: string;
  otpHash: string;
  otpExpiresAt: Date;
}): Promise<ReviewerInvitation> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_reviewer_otp", {
    p_request_id: requestId,
    p_invitation_hash: invitationTokenHash,
    p_otp_hash: otpHash,
    p_otp_expires_at: otpExpiresAt.toISOString(),
  });

  if (error) {
    throw new Error("INVALID_INVITATION");
  }

  return toInvitation(z.array(reviewerInvitationSchema).parse(data)[0]);
}

export async function verifyReviewerOtp({
  requestId,
  invitationTokenHash,
  submittedOtpHash,
  sessionHash,
  sessionExpiresAt,
}: {
  requestId: string;
  invitationTokenHash: string;
  submittedOtpHash: string;
  sessionHash: string;
  sessionExpiresAt: Date;
}): Promise<ReviewerSession> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_reviewer_otp", {
    p_request_id: requestId,
    p_invitation_hash: invitationTokenHash,
    p_submitted_otp_hash: submittedOtpHash,
    p_session_hash: sessionHash,
    p_session_expires_at: sessionExpiresAt.toISOString(),
  });

  if (error) {
    throw new Error("INVALID_OTP");
  }

  return toReviewerSession(z.array(reviewerSessionSchema).parse(data)[0]);
}
