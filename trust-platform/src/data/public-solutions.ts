import "server-only";

import { cache } from "react";
import { z } from "zod";

import {
  getPublicProfileBySlug,
  type PublicEvidenceRecord,
} from "@/data/public-profile";
import type { ParsedPublicSolutionSearch } from "@/domain/public-solution-search";
import { createClient } from "@/lib/supabase/server";

const publicSolutionRowSchema = z.object({
  evidence_id: z.uuid(),
  profile_slug: z.string(),
  provider_display_name: z.string(),
  provider_headline: z.string(),
  provider_country_code: z.string().nullable(),
  public_title: z.string(),
  public_service_category: z.string(),
  public_company_name: z.string().nullable(),
  public_outcome_metric_value: z.coerce.number().nullable(),
  public_outcome_metric_unit: z.string().nullable(),
  public_reference_available: z.boolean(),
  verification_badge: z.literal("company_domain_verified"),
  published_at: z.string(),
  total_count: z.coerce.number().int().nonnegative(),
});

export type PublicSolutionListItem = {
  id: string;
  profileSlug: string;
  providerDisplayName: string;
  providerHeadline: string;
  providerCountryCode: string | null;
  publicTitle: string;
  publicServiceCategory: string;
  publicCompanyName: string | null;
  publicOutcomeMetricValue: number | null;
  publicOutcomeMetricUnit: string | null;
  publicReferenceAvailable: boolean;
  verificationBadge: "company_domain_verified";
  publishedAt: string;
};

export type PublicSolutionSearchResult = {
  items: PublicSolutionListItem[];
  totalCount: number;
};

export type PublicSolutionDetail = PublicEvidenceRecord & {
  profileSlug: string;
  providerDisplayName: string;
  providerHeadline: string;
  providerCountryCode: string | null;
  providerBio: string;
  providerServiceCategories: string[];
};

function toPublicSolutionListItem(
  row: z.infer<typeof publicSolutionRowSchema>,
): PublicSolutionListItem {
  return {
    id: row.evidence_id,
    profileSlug: row.profile_slug,
    providerDisplayName: row.provider_display_name,
    providerHeadline: row.provider_headline,
    providerCountryCode: row.provider_country_code,
    publicTitle: row.public_title,
    publicServiceCategory: row.public_service_category,
    publicCompanyName: row.public_company_name,
    publicOutcomeMetricValue: row.public_outcome_metric_value,
    publicOutcomeMetricUnit: row.public_outcome_metric_unit,
    publicReferenceAvailable: row.public_reference_available,
    verificationBadge: row.verification_badge,
    publishedAt: row.published_at,
  };
}

export async function searchPublicSolutions(
  search: Pick<ParsedPublicSolutionSearch, "query" | "category" | "country"> & {
    limit: number;
    offset: number;
  },
): Promise<PublicSolutionSearchResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_public_solutions", {
    p_query: search.query,
    p_service_category: search.category,
    p_country_code: search.country,
    p_limit: search.limit,
    p_offset: search.offset,
  });

  if (error) {
    throw new Error("Unable to search public solutions.");
  }

  const rows = z.array(publicSolutionRowSchema).parse(data);

  return {
    items: rows.map(toPublicSolutionListItem),
    totalCount: rows[0]?.total_count ?? 0,
  };
}

export const getPublicSolution = cache(
  async (
    profileSlug: string,
    evidenceId: string,
  ): Promise<PublicSolutionDetail | null> => {
    const profile = await getPublicProfileBySlug(profileSlug);
    const evidence = profile?.evidence.find((item) => item.id === evidenceId);

    if (!profile || !evidence) {
      return null;
    }

    return {
      ...evidence,
      profileSlug: profile.slug,
      providerDisplayName: profile.displayName,
      providerHeadline: profile.headline,
      providerCountryCode: profile.countryCode,
      providerBio: profile.bio,
      providerServiceCategories: profile.serviceCategories,
    };
  },
);
