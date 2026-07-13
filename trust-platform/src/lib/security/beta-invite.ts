import "server-only";

import { createHmac } from "node:crypto";

import { env } from "@/lib/env";

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashBetaInviteEmail(email: string): string {
  return createHmac("sha256", env.TOKEN_PEPPER)
    .update(`beta-invite:${normalizeInviteEmail(email)}`)
    .digest("hex");
}
