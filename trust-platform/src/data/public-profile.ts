import "server-only";

import { z } from "zod";

import {
  acquisitionSources,
  rehireResponses,
  type PublicEvidence,
} from "@/domain/public-evidence";
import { createClient } from "@/lib/supabase/server";

const publicProfileRowSchema = z.object({
  profile_id: z.uuid(),
  slug: z.string(),
  display_name: z.string(),
  headline: z.string(),
  bio: z.string(),
  country_code: z.string().nullable(),
  time_zone: z.string().nullable(),
  service_categories: z.array(z.string()).nullable(),
});

const publicEvidenceRowSchema = z.object({
  evidence_id: z.uuid(),
  public_title: z.string(),
  public_service_category: z.string(),
  public_company_name: z.string().nullable(),
  public_acquisition_source: z.enum(acquisitionSources).nullable(),
  public_source_platform_label: z.string().nullable(),
  public_project_start: z.string().nullable(),
  public_project_end: z.string().nullable(),
  public_outcome_statement: z.string().nullable(),
  public_outcome_metric_value: z.coerce.number().nullable(),
  public_outcome_metric_unit: z.string().nullable(),
  public_reviewer_name: z.string().nullable(),
  public_reviewer_job_title: z.string().nullable(),
  public_reviewer_comment: z.string().nullable(),
  public_rehire_response: z.enum(rehireResponses).nullable(),
  public_reference_available: z.boolean(),
  verification_badge: z.literal("company_domain_verified"),
  published_at: z.string(),
});

export type PublicEvidenceRecord = PublicEvidence & {
  id: string;
  publishedAt: string;
};

export type PublicProfile = {
  profileId: string;
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  countryCode: string | null;
  timeZone: string | null;
  serviceCategories: string[];
  evidence: PublicEvidenceRecord[];
};

function toPublicEvidenceRecord(
  row: z.infer<typeof publicEvidenceRowSchema>,
): PublicEvidenceRecord {
  return {
    id: row.evidence_id,
    publicTitle: row.public_title,
    publicServiceCategory: row.public_service_category,
    verificationBadge: row.verification_badge,
    publicCompanyName: row.public_company_name,
    publicAcquisitionSource: row.public_acquisition_source,
    publicSourcePlatformLabel: row.public_source_platform_label,
    publicProjectStart: row.public_project_start,
    publicProjectEnd: row.public_project_end,
    publicOutcomeStatement: row.public_outcome_statement,
    publicOutcomeMetricValue: row.public_outcome_metric_value,
    publicOutcomeMetricUnit: row.public_outcome_metric_unit,
    publicReviewerName: row.public_reviewer_name,
    publicReviewerJobTitle: row.public_reviewer_job_title,
    publicReviewerComment: row.public_reviewer_comment,
    publicRehireResponse: row.public_rehire_response,
    publicReferenceAvailable: row.public_reference_available,
    publishedAt: row.published_at,
  };
}

export async function getPublicProfileBySlug(
  slug: string,
): Promise<PublicProfile | null> {
  const supabase = await createClient();
  const { data: profileData, error: profileError } = await supabase.rpc(
    "get_public_profile",
    { p_slug: slug },
  );

  if (profileError) {
    throw new Error("Unable to load public profile.");
  }

  const [profileRow] = z.array(publicProfileRowSchema).parse(profileData);

  if (!profileRow) {
    return null;
  }

  const { data: evidenceData, error: evidenceError } = await supabase.rpc(
    "list_public_evidence",
    { p_slug: slug },
  );

  if (evidenceError) {
    throw new Error("Unable to load public evidence.");
  }

  const evidence = z
    .array(publicEvidenceRowSchema)
    .parse(evidenceData)
    .map(toPublicEvidenceRecord);

  return {
    profileId: profileRow.profile_id,
    slug: profileRow.slug,
    displayName: profileRow.display_name,
    headline: profileRow.headline,
    bio: profileRow.bio,
    countryCode: profileRow.country_code,
    timeZone: profileRow.time_zone,
    serviceCategories: profileRow.service_categories ?? [],
    evidence,
  };
}
