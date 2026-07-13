import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export const adminBetaAccessStatusSchema = z.enum([
  "new",
  "reviewing",
  "invited",
  "declined",
  "closed",
]);

export const adminBetaAccessIntentSchema = z.enum(["developer", "company"]);

const adminRequestSchema = z.object({
  id: z.uuid(),
  intent: adminBetaAccessIntentSchema,
  requester_name: z.string(),
  work_email: z.email(),
  company_name: z.string().nullable(),
  role: z.string().nullable(),
  use_case: z.string(),
  source_path: z.string().nullable(),
  status: adminBetaAccessStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

const adminRequestListItemSchema = adminRequestSchema.extend({
  total_count: z.coerce.number().int().nonnegative(),
});

const adminSummarySchema = z.object({
  status: adminBetaAccessStatusSchema,
  request_count: z.coerce.number().int().nonnegative(),
});

const adminMutationSchema = z.object({
  id: z.uuid(),
  status: adminBetaAccessStatusSchema,
});

const adminInviteMutationSchema = adminMutationSchema.extend({
  work_email: z.email(),
  requester_name: z.string(),
});

export type AdminBetaAccessStatus = z.infer<
  typeof adminBetaAccessStatusSchema
>;
export type AdminBetaAccessIntent = z.infer<
  typeof adminBetaAccessIntentSchema
>;
export type AdminBetaAccessRequest = z.infer<typeof adminRequestSchema>;
export type AdminBetaAccessRequestListItem = z.infer<
  typeof adminRequestListItemSchema
>;

function firstRow<T>(data: unknown, schema: z.ZodType<T>): T {
  const rows = z.array(schema).parse(data);

  if (!rows[0]) {
    throw new Error("BETA_ACCESS_REQUEST_NOT_FOUND");
  }

  return rows[0];
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_current_user_admin");

  if (error) {
    throw error;
  }

  return data === true;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isCurrentUserAdmin())) {
    throw new Error("ADMIN_REQUIRED");
  }
}

export async function isBetaInviteHashActive(
  emailHash: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_beta_invite_hash_active", {
    p_email_hash: emailHash,
  });

  return !error && data === true;
}

export async function listAdminBetaAccessRequests({
  status,
  intent,
  limit = 50,
  offset = 0,
}: {
  status?: AdminBetaAccessStatus;
  intent?: AdminBetaAccessIntent;
  limit?: number;
  offset?: number;
} = {}): Promise<readonly AdminBetaAccessRequestListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "list_admin_beta_access_requests",
    {
      p_status: status,
      p_intent: intent,
      p_limit: limit,
      p_offset: offset,
    },
  );

  if (error) {
    throw error;
  }

  return z.array(adminRequestListItemSchema).parse(data);
}

export async function getAdminBetaAccessRequest(
  requestId: string,
): Promise<AdminBetaAccessRequest> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_admin_beta_access_request",
    { p_request_id: requestId },
  );

  if (error) {
    throw error;
  }

  return firstRow(data, adminRequestSchema);
}

export async function summarizeAdminBetaAccessRequests(
  intent?: AdminBetaAccessIntent,
): Promise<
  Record<AdminBetaAccessStatus, number>
> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "summarize_admin_beta_access_requests",
    { p_intent: intent },
  );

  if (error) {
    throw error;
  }

  const summary: Record<AdminBetaAccessStatus, number> = {
    new: 0,
    reviewing: 0,
    invited: 0,
    declined: 0,
    closed: 0,
  };

  for (const row of z.array(adminSummarySchema).parse(data)) {
    summary[row.status] = row.request_count;
  }

  return summary;
}

export async function updateAdminBetaAccessRequestStatus(
  requestId: string,
  status: Exclude<AdminBetaAccessStatus, "invited">,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "update_admin_beta_access_request_status",
    {
      p_request_id: requestId,
      p_status: status,
    },
  );

  if (error) {
    throw error;
  }

  return firstRow(data, adminMutationSchema);
}

export async function inviteAdminBetaAccessRequest(
  requestId: string,
  emailHash: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "invite_admin_beta_access_request",
    {
      p_request_id: requestId,
      p_email_hash: emailHash,
    },
  );

  if (error) {
    throw error;
  }

  return firstRow(data, adminInviteMutationSchema);
}
