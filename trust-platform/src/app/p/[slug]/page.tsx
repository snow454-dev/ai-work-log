import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getPublicProfileBySlug,
  type PublicEvidenceRecord,
} from "@/data/public-profile";
import { LightLegalFooter } from "@/components/legal-footer";
import type {
  AcquisitionSource,
  RehireResponse,
} from "@/domain/public-evidence";

const acquisitionLabels: Record<AcquisitionSource, string> = {
  upwork: "Upwork",
  sankaku: "サンカク",
  other_platform: "Other platform",
  referral: "Referral",
  direct: "Direct",
  other: "Other",
};

const rehireLabels: Record<RehireResponse, string> = {
  yes: "Would hire again",
  maybe: "Open to future work",
  no: "Not selected",
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return (
    <main className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-zinc-950">
            Proofboard
          </Link>
          <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            Public verified profile
          </p>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Company-approved proof for independent work
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance md:text-5xl">
                {profile.displayName}
              </h1>
              {profile.headline ? (
                <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700 text-pretty">
                  {profile.headline}
                </p>
              ) : null}
              {profile.bio ? (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600 text-pretty">
                  {profile.bio}
                </p>
              ) : null}
            </div>

            <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <h2 className="text-sm font-semibold text-zinc-950">
                Trust boundary
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
                This page only shows fields approved by a company reviewer and
                then published by the professional. Private raw project data is
                not exposed here.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <ProfileMeta label="Verified proof" value={profile.evidence.length} />
                <ProfileMeta
                  label="Reference paths"
                  value={
                    profile.evidence.filter(
                      (evidence) => evidence.publicReferenceAvailable,
                    ).length
                  }
                />
                <ProfileMeta label="Country" value={profile.countryCode} />
                <ProfileMeta label="Time zone" value={profile.timeZone} />
              </dl>
            </aside>
          </div>

          {profile.serviceCategories.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {profile.serviceCategories.map((category) => (
                <li
                  key={category}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700"
                >
                  {category}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Verified evidence
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-950 text-balance">
                Work proof approved for public sharing
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              {profile.evidence.length} active proof card
              {profile.evidence.length === 1 ? "" : "s"}
            </p>
          </div>

          {profile.evidence.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-950">
                No active proof yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 text-pretty">
                This profile is public, but no verified evidence is currently
                active.
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-5">
              {profile.evidence.map((evidence) => (
                <EvidenceCard
                  key={evidence.id}
                  evidence={evidence}
                  profileSlug={profile.slug}
                />
              ))}
            </ul>
          )}
        </section>

        <LightLegalFooter />
      </div>
    </main>
  );
}

function ProfileMeta({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950 tabular-nums">
        {value ?? "Not shared"}
      </dd>
    </div>
  );
}

function EvidenceCard({
  evidence,
  profileSlug,
}: {
  evidence: PublicEvidenceRecord;
  profileSlug: string;
}) {
  const source = formatSource(evidence);
  const metric = formatMetric(evidence);
  const period = formatPeriod(
    evidence.publicProjectStart,
    evidence.publicProjectEnd,
  );
  const reviewerMeta = [
    evidence.publicReviewerName,
    evidence.publicReviewerJobTitle,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <li className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Company-domain verified
            </span>
            {evidence.publicReferenceAvailable ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                Reference path available
              </span>
            ) : null}
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
              {evidence.publicServiceCategory}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-zinc-950 text-balance">
            {evidence.publicTitle}
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Published {formatDate(evidence.publishedAt)}
          </p>
        </div>
        <p className="max-w-xs rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 text-pretty">
          Only company-approved fields are visible on this card.
        </p>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <EvidenceField
          label="Client company"
          value={evidence.publicCompanyName ?? "Hidden by consent"}
        />
        <EvidenceField label="Acquisition source" value={source} />
        <EvidenceField label="Project period" value={period} />
        <EvidenceField label="Outcome metric" value={metric} />
      </dl>

      {evidence.publicOutcomeStatement ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <h4 className="text-sm font-medium text-zinc-500">
            Verified outcome
          </h4>
          <p className="mt-2 text-zinc-800 text-pretty">
            {evidence.publicOutcomeStatement}
          </p>
        </div>
      ) : null}

      {evidence.publicReferenceAvailable ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <h4 className="text-sm font-semibold text-zinc-950">
            Structured reference path
          </h4>
          <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
            The company reviewer allowed future reference requests to be routed
            through Proofboard. Reviewer contact details stay private unless a
            future request is explicitly accepted.
          </p>
          <Link
            href={`/p/${profileSlug}/reference/${evidence.id}`}
            className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
          >
            Request reference path
          </Link>
        </div>
      ) : null}

      {reviewerMeta ||
      evidence.publicReviewerComment ||
      evidence.publicRehireResponse ? (
        <div className="mt-6 border-t border-zinc-200 pt-5">
          <h4 className="text-sm font-semibold text-zinc-950">
            Reviewer-approved reference details
          </h4>
          {reviewerMeta ? (
            <p className="mt-2 text-sm text-zinc-600">{reviewerMeta}</p>
          ) : null}
          {evidence.publicReviewerComment ? (
            <p className="mt-3 text-sm leading-6 text-zinc-700 text-pretty">
              “{evidence.publicReviewerComment}”
            </p>
          ) : null}
          {evidence.publicRehireResponse ? (
            <p className="mt-3 text-sm font-medium text-zinc-950">
              {rehireLabels[evidence.publicRehireResponse]}
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function EvidenceField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-950 text-pretty">{value}</dd>
    </div>
  );
}

function formatSource(evidence: PublicEvidenceRecord): string {
  if (!evidence.publicAcquisitionSource) {
    return "Hidden by consent";
  }

  if (
    evidence.publicAcquisitionSource === "other_platform" &&
    evidence.publicSourcePlatformLabel
  ) {
    return evidence.publicSourcePlatformLabel;
  }

  return acquisitionLabels[evidence.publicAcquisitionSource];
}

function formatMetric(evidence: PublicEvidenceRecord): string {
  if (
    evidence.publicOutcomeMetricValue === null ||
    !evidence.publicOutcomeMetricUnit
  ) {
    return "Hidden or not provided";
  }

  return `${evidence.publicOutcomeMetricValue} ${evidence.publicOutcomeMetricUnit}`;
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "Hidden or not provided";
  }

  return `${start ?? "Unknown"} → ${end ?? "Present"}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
