import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

type ClaimsClient = {
  auth: {
    getClaims(): Promise<{
      data: { claims: { sub?: string } | null } | null;
      error: unknown;
    }>;
  };
};

export async function requireUserId(client: ClaimsClient): Promise<string> {
  const { data, error } = await client.auth.getClaims();
  const subject = data?.claims?.sub;

  if (error || !subject) {
    throw new Error("UNAUTHENTICATED");
  }

  return subject;
}

export const getCurrentUserId = cache(async () =>
  requireUserId(await createClient()),
);

export const getOptionalUserId = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const subject = data?.claims?.sub;

  return error || !subject ? null : subject;
});
