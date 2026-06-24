"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  reviewerSessionCookieName,
  setReviewerOtp,
  verifyReviewerOtp,
} from "@/data/reviewer-auth";
import { getEmailTransport } from "@/lib/email";
import { verificationOtp } from "@/lib/email/templates";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/security/tokens";
import { createOtp, hashOtp } from "@/lib/security/otp";

export type ReviewerAuthState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

const otpSchema = z.object({
  otp: z
    .string({ error: "Enter the six-digit code." })
    .trim()
    .regex(/^\d{6}$/, "Enter the six-digit code."),
});

function tenMinutesFromNow(): Date {
  return new Date(Date.now() + 10 * 60 * 1000);
}

function thirtyMinutesFromNow(): Date {
  return new Date(Date.now() + 30 * 60 * 1000);
}

export async function requestReviewerOtp(
  requestId: string,
  invitationToken: string,
  prevState: ReviewerAuthState,
  formData: FormData,
): Promise<ReviewerAuthState> {
  void prevState;
  void formData;

  try {
    const otp = createOtp();
    const context = await setReviewerOtp({
      requestId,
      invitationTokenHash: hashOpaqueToken(invitationToken),
      otpHash: hashOtp(otp),
      otpExpiresAt: tenMinutesFromNow(),
    });

    await getEmailTransport().send(
      verificationOtp({
        to: context.reviewerEmail,
        professionalName: context.professionalName,
        projectTitle: context.projectTitle,
        otp,
        expiresAt: context.expiresAt,
      }),
    );
  } catch {
    // Return the same response for invalid links and delivery failures to avoid
    // leaking reviewer or request existence.
  }

  return {
    ok: true,
    message: "If the invitation is valid, a code has been sent.",
  };
}

export async function verifyReviewerOtpAction(
  requestId: string,
  invitationToken: string,
  prevState: ReviewerAuthState,
  formData: FormData,
): Promise<ReviewerAuthState> {
  void prevState;

  const parsed = otpSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors,
      message: "Enter the six-digit code.",
    };
  }

  const sessionToken = createOpaqueToken();

  try {
    await verifyReviewerOtp({
      requestId,
      invitationTokenHash: hashOpaqueToken(invitationToken),
      submittedOtpHash: hashOtp(parsed.data.otp),
      sessionHash: hashOpaqueToken(sessionToken),
      sessionExpiresAt: thirtyMinutesFromNow(),
    });
  } catch {
    return {
      ok: false,
      message: "That code is invalid or expired. Request a new code.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(reviewerSessionCookieName(requestId), sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: `/verify/${requestId}`,
    maxAge: 60 * 30,
  });

  redirect(`/verify/${requestId}/review`);
}
