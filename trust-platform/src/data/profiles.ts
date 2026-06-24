import "server-only";

import type { ProfileInput } from "@/domain/profile";
import { createClient } from "@/lib/supabase/server";

export type ProfileRecord = {
  id: string;
  userId: string;
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  countryCode: string | null;
  timeZone: string | null;
  serviceCategories: string[];
  isPublic: boolean;
};

type ProfileRow = {
  id: string;
  user_id: string;
  slug: string;
  display_name: string;
  headline: string;
  bio: string;
  country_code: string | null;
  time_zone: string | null;
  service_categories: string[] | null;
  is_public: boolean;
};

function toProfileRecord(row: ProfileRow): ProfileRecord {
  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    displayName: row.display_name,
    headline: row.headline,
    bio: row.bio,
    countryCode: row.country_code,
    timeZone: row.time_zone,
    serviceCategories: row.service_categories ?? [],
    isPublic: row.is_public,
  };
}

export async function getProfileForUser(
  userId: string,
): Promise<ProfileRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,user_id,slug,display_name,headline,bio,country_code,time_zone,service_categories,is_public",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load profile.");
  }

  return data ? toProfileRecord(data) : null;
}

export async function upsertProfileForUser({
  userId,
  input,
}: {
  userId: string;
  input: ProfileInput;
}): Promise<ProfileRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        slug: input.slug,
        display_name: input.displayName,
        headline: input.headline,
        bio: input.bio,
        country_code: input.countryCode,
        time_zone: input.timeZone,
        service_categories: input.serviceCategories,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select(
      "id,user_id,slug,display_name,headline,bio,country_code,time_zone,service_categories,is_public",
    )
    .single();

  if (error) {
    throw new Error(
      error.code === "23505"
        ? "That profile URL is already taken."
        : "Unable to save profile.",
    );
  }

  return toProfileRecord(data);
}
