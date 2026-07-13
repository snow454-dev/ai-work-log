"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  betaAccessDeniedMessage,
  isEmailAllowedForBeta,
} from "@/domain/beta-access";
import { isBetaInviteHashActive } from "@/data/admin-beta-access";
import { env } from "@/lib/env";
import { hashBetaInviteEmail } from "@/lib/security/beta-invite";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  error?: string;
  sent?: boolean;
};

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  next: z.string().optional(),
});

function safeNextPath(value: unknown): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/dashboard";
  }

  return trimmed;
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  const allowedByConfiguration = isEmailAllowedForBeta({
      email: parsed.data.email,
      allowedEmails: env.BETA_ALLOWED_EMAILS,
      additionalAllowedEmails: env.BETA_ADDITIONAL_ALLOWED_EMAILS,
      adminAllowedEmails: env.ADMIN_ALLOWED_EMAILS,
    });
  const allowedByInvitation = allowedByConfiguration
    ? false
    : await isBetaInviteHashActive(hashBetaInviteEmail(parsed.data.email));

  if (!allowedByConfiguration && !allowedByInvitation) {
    return { error: betaAccessDeniedMessage };
  }

  const supabase = await createClient();
  const next = safeNextPath(parsed.data.next);
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${env.APP_URL}/auth/confirm?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: "Unable to send the sign-in email." };
  }

  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}
