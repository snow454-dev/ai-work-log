"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { reviewerSessionCookieName } from "@/data/reviewer-auth";
import {
  getReviewerReviewContext,
  submitVerification,
} from "@/data/verifications";
import {
  safeParseReviewerVerification,
  type ReviewerVerificationInput,
} from "@/domain/verification";
import { getEmailTransport } from "@/lib/email";
import { verificationReceipt } from "@/lib/email/templates";
import { env } from "@/lib/env";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";

export type ReviewerVerificationState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

function checkbox(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

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
    projectExisted: checkbox(formData, "projectExisted"),
    sourceAccurate: checkbox(formData, "sourceAccurate"),
    roleAccurate: checkbox(formData, "roleAccurate"),
    outcomeAccurate: checkbox(formData, "outcomeAccurate"),
    metricAccurate: checkbox(formData, "metricAccurate"),
    hasOutcomeMetric: checkbox(formData, "hasOutcomeMetric"),
    rehireResponse: optionalText(formData, "rehireResponse"),
    sharingPreference: optionalText(formData, "sharingPreference"),
    openToReferenceRequests: checkbox(formData, "openToReferenceRequests"),
    reviewerName: optionalText(formData, "reviewerName"),
    reviewerJobTitle: optionalText(formData, "reviewerJobTitle"),
    reviewerComment: optionalText(formData, "reviewerComment"),
    consentConfirmed: checkbox(formData, "consentConfirmed"),
    visibility: {
      companyName: checkbox(formData, "showCompanyName"),
      acquisitionSource: checkbox(formData, "showAcquisitionSource"),
      reviewerName: checkbox(formData, "showReviewerName"),
      reviewerJobTitle: checkbox(formData, "showReviewerJobTitle"),
      projectPeriod: checkbox(formData, "showProjectPeriod"),
      outcomeStatement: checkbox(formData, "showOutcomeStatement"),
      outcomeMetric: checkbox(formData, "showOutcomeMetric"),
      reviewerComment: checkbox(formData, "showReviewerComment"),
      rehireResponse: checkbox(formData, "showRehireResponse"),
    },
  };
}

async function sessionHashForRequest(requestId: string): Promise<string> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(reviewerSessionCookieName(requestId))?.value;

  if (!sessionToken) {
    throw new Error("REVIEWER_SESSION_REQUIRED");
  }

  return hashOpaqueToken(sessionToken);
}

export async function submitReviewerVerification(
  requestId: string,
  _prevState: ReviewerVerificationState,
  formData: FormData,
): Promise<ReviewerVerificationState> {
  const parsed = safeParseReviewerVerification(parseForm(formData));

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Fix the highlighted fields.",
    };
  }

  let result: Awaited<ReturnType<typeof submitWithReceipt>>;

  try {
    result = await submitWithReceipt(requestId, parsed.data);
  } catch {
    return {
      ok: false,
      message: "Unable to submit this verification. Request a fresh link.",
    };
  }

  redirect(`/verify/${requestId}/review?submitted=${result.status}`);
}

async function submitWithReceipt(
  requestId: string,
  input: ReviewerVerificationInput,
) {
  const sessionHash = await sessionHashForRequest(requestId);
  const context = await getReviewerReviewContext({ requestId, sessionHash });

  if (!context) {
    throw new Error("REVIEW_CONTEXT_NOT_FOUND");
  }

  const receiptToken = createOpaqueToken();
  const result = await submitVerification({
    requestId,
    sessionHash,
    input,
    receiptTokenHash: hashOpaqueToken(receiptToken),
  });

  await getEmailTransport().send(
    verificationReceipt({
      to: context.reviewerEmail,
      professionalName: "Proofboard",
      projectTitle: context.projectTitle,
      actionUrl: `${env.APP_URL}/verification-receipt/${result.verificationId}?token=${encodeURIComponent(
        receiptToken,
      )}`,
      note: "Receipt viewing and future changes require a fresh OTP.",
    }),
  );

  return result;
}
