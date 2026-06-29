import Link from "next/link";
import { notFound } from "next/navigation";

import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  getPublicProfileBySlug,
  type PublicEvidenceRecord,
} from "@/data/public-profile";
import type {
  AcquisitionSource,
  RehireResponse,
} from "@/domain/public-evidence";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

const acquisitionLabels: Record<Locale, Record<AcquisitionSource, string>> = {
  en: {
    upwork: "Upwork",
    sankaku: "サンカク",
    other_platform: "Other platform",
    referral: "Referral",
    direct: "Direct",
    other: "Other",
  },
  ja: {
    upwork: "Upwork",
    sankaku: "サンカク",
    other_platform: "その他プラットフォーム",
    referral: "紹介",
    direct: "直接契約",
    other: "その他",
  },
};

const rehireLabels: Record<Locale, Record<RehireResponse, string>> = {
  en: {
    yes: "Would hire again",
    maybe: "Open to future work",
    no: "Not selected",
  },
  ja: {
    yes: "再依頼したい",
    maybe: "将来的な依頼に前向き",
    no: "未選択",
  },
};

const profileCopy: Record<
  Locale,
  {
    badge: string;
    eyebrow: string;
    trustTitle: string;
    trustBody: string;
    verifiedProof: string;
    referencePaths: string;
    country: string;
    timeZone: string;
    evidenceEyebrow: string;
    evidenceTitle: string;
    activeProof: (count: number) => string;
    noProofTitle: string;
    noProofBody: string;
    notShared: string;
    verifiedBadge: string;
    referenceBadge: string;
    published: string;
    cardBoundary: string;
    clientCompany: string;
    hiddenByConsent: string;
    acquisitionSource: string;
    projectPeriod: string;
    outcomeMetric: string;
    hiddenOrMissing: string;
    unknown: string;
    present: string;
    verifiedOutcome: string;
    referencePathTitle: string;
    referencePathBody: string;
    referenceCta: string;
    reviewerDetails: string;
  }
> = {
  en: {
    badge: "Public verified profile",
    eyebrow: "Company-approved proof for independent work",
    trustTitle: "Trust boundary",
    trustBody:
      "This page only shows fields approved by a company reviewer and then published by the professional. Private raw project data is not exposed here.",
    verifiedProof: "Verified proof",
    referencePaths: "Reference paths",
    country: "Country",
    timeZone: "Time zone",
    evidenceEyebrow: "Verified evidence",
    evidenceTitle: "Work proof approved for public sharing",
    activeProof: (count) =>
      `${count} active proof card${count === 1 ? "" : "s"}`,
    noProofTitle: "No active proof yet",
    noProofBody:
      "This profile is public, but no verified evidence is currently active.",
    notShared: "Not shared",
    verifiedBadge: "Company-domain verified",
    referenceBadge: "Reference path available",
    published: "Published",
    cardBoundary: "Only company-approved fields are visible on this card.",
    clientCompany: "Client company",
    hiddenByConsent: "Hidden by consent",
    acquisitionSource: "Acquisition source",
    projectPeriod: "Project period",
    outcomeMetric: "Outcome metric",
    hiddenOrMissing: "Hidden or not provided",
    unknown: "Unknown",
    present: "Present",
    verifiedOutcome: "Verified outcome",
    referencePathTitle: "Structured reference path",
    referencePathBody:
      "The company reviewer allowed future reference requests to be routed through Proofboard. Reviewer contact details stay private unless a future request is explicitly accepted.",
    referenceCta: "Request reference path",
    reviewerDetails: "Reviewer-approved reference details",
  },
  ja: {
    badge: "公開中の検証済みプロフィール",
    eyebrow: "個人の仕事を企業承認済みの実績へ",
    trustTitle: "信頼の境界線",
    trustBody:
      "このページには、企業確認担当者が承認し、本人が公開した項目だけが表示されます。非公開の元データは公開されません。",
    verifiedProof: "検証済み実績",
    referencePaths: "紹介依頼ルート",
    country: "国",
    timeZone: "タイムゾーン",
    evidenceEyebrow: "検証済み実績",
    evidenceTitle: "公開共有が承認された仕事の実績",
    activeProof: (count) => `${count}件の有効な実績カード`,
    noProofTitle: "有効な実績はまだありません",
    noProofBody:
      "このプロフィールは公開されていますが、現在有効な検証済み実績はありません。",
    notShared: "未共有",
    verifiedBadge: "企業ドメイン確認済み",
    referenceBadge: "紹介依頼ルートあり",
    published: "公開日",
    cardBoundary: "このカードには企業が承認した項目だけが表示されます。",
    clientCompany: "顧客企業",
    hiddenByConsent: "同意により非表示",
    acquisitionSource: "獲得経路",
    projectPeriod: "プロジェクト期間",
    outcomeMetric: "成果指標",
    hiddenOrMissing: "非表示または未入力",
    unknown: "不明",
    present: "現在",
    verifiedOutcome: "検証済み成果",
    referencePathTitle: "構造化された紹介依頼ルート",
    referencePathBody:
      "企業の確認担当者は、Proofboard経由の将来的な紹介依頼を許可しています。今後の依頼が明示的に承認されるまで、確認担当者の連絡先は非公開です。",
    referenceCta: "紹介依頼を送る",
    reviewerDetails: "確認担当者が承認した紹介情報",
  },
};

export default async function PublicProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<LocaleSearchParams>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(query);
  const copy = profileCopy[locale];
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-zinc-950">
            Proofboard
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path={`/p/${profile.slug}`} />
            <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              {copy.badge}
            </p>
          </div>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                {copy.eyebrow}
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
                {copy.trustTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
                {copy.trustBody}
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <ProfileMeta
                  label={copy.verifiedProof}
                  value={profile.evidence.length}
                  notSharedLabel={copy.notShared}
                />
                <ProfileMeta
                  label={copy.referencePaths}
                  value={
                    profile.evidence.filter(
                      (evidence) => evidence.publicReferenceAvailable,
                    ).length
                  }
                  notSharedLabel={copy.notShared}
                />
                <ProfileMeta
                  label={copy.country}
                  value={profile.countryCode}
                  notSharedLabel={copy.notShared}
                />
                <ProfileMeta
                  label={copy.timeZone}
                  value={profile.timeZone}
                  notSharedLabel={copy.notShared}
                />
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
                {copy.evidenceEyebrow}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-zinc-950 text-balance">
                {copy.evidenceTitle}
              </h2>
            </div>
            <p className="text-sm text-zinc-500">
              {copy.activeProof(profile.evidence.length)}
            </p>
          </div>

          {profile.evidence.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-950">
                {copy.noProofTitle}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 text-pretty">
                {copy.noProofBody}
              </p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-5">
              {profile.evidence.map((evidence) => (
                <EvidenceCard
                  key={evidence.id}
                  evidence={evidence}
                  profileSlug={profile.slug}
                  locale={locale}
                  copy={copy}
                />
              ))}
            </ul>
          )}
        </section>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function ProfileMeta({
  label,
  value,
  notSharedLabel,
}: {
  label: string;
  value: string | number | null;
  notSharedLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950 tabular-nums">
        {value ?? notSharedLabel}
      </dd>
    </div>
  );
}

function EvidenceCard({
  evidence,
  profileSlug,
  locale,
  copy,
}: {
  evidence: PublicEvidenceRecord;
  profileSlug: string;
  locale: Locale;
  copy: (typeof profileCopy)[Locale];
}) {
  const source = formatSource(evidence, locale, copy);
  const metric = formatMetric(evidence, copy);
  const period = formatPeriod(
    evidence.publicProjectStart,
    evidence.publicProjectEnd,
    copy,
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
              {copy.verifiedBadge}
            </span>
            {evidence.publicReferenceAvailable ? (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {copy.referenceBadge}
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
            {copy.published} {formatDate(evidence.publishedAt, locale)}
          </p>
        </div>
        <p className="max-w-xs rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-600 text-pretty">
          {copy.cardBoundary}
        </p>
      </div>

      <dl className="mt-6 grid gap-4 md:grid-cols-2">
        <EvidenceField
          label={copy.clientCompany}
          value={evidence.publicCompanyName ?? copy.hiddenByConsent}
        />
        <EvidenceField label={copy.acquisitionSource} value={source} />
        <EvidenceField label={copy.projectPeriod} value={period} />
        <EvidenceField label={copy.outcomeMetric} value={metric} />
      </dl>

      {evidence.publicOutcomeStatement ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <h4 className="text-sm font-medium text-zinc-500">
            {copy.verifiedOutcome}
          </h4>
          <p className="mt-2 text-zinc-800 text-pretty">
            {evidence.publicOutcomeStatement}
          </p>
        </div>
      ) : null}

      {evidence.publicReferenceAvailable ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
          <h4 className="text-sm font-semibold text-zinc-950">
            {copy.referencePathTitle}
          </h4>
          <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
            {copy.referencePathBody}
          </p>
          <Link
            href={localizedHref(
              `/p/${profileSlug}/reference/${evidence.id}`,
              locale,
            )}
            className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
          >
            {copy.referenceCta}
          </Link>
        </div>
      ) : null}

      {reviewerMeta ||
      evidence.publicReviewerComment ||
      evidence.publicRehireResponse ? (
        <div className="mt-6 border-t border-zinc-200 pt-5">
          <h4 className="text-sm font-semibold text-zinc-950">
            {copy.reviewerDetails}
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
              {rehireLabels[locale][evidence.publicRehireResponse]}
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

function formatSource(
  evidence: PublicEvidenceRecord,
  locale: Locale,
  copy: (typeof profileCopy)[Locale],
): string {
  if (!evidence.publicAcquisitionSource) {
    return copy.hiddenByConsent;
  }

  if (
    evidence.publicAcquisitionSource === "other_platform" &&
    evidence.publicSourcePlatformLabel
  ) {
    return evidence.publicSourcePlatformLabel;
  }

  return acquisitionLabels[locale][evidence.publicAcquisitionSource];
}

function formatMetric(
  evidence: PublicEvidenceRecord,
  copy: (typeof profileCopy)[Locale],
): string {
  if (
    evidence.publicOutcomeMetricValue === null ||
    !evidence.publicOutcomeMetricUnit
  ) {
    return copy.hiddenOrMissing;
  }

  return `${evidence.publicOutcomeMetricValue} ${evidence.publicOutcomeMetricUnit}`;
}

function formatPeriod(
  start: string | null,
  end: string | null,
  copy: (typeof profileCopy)[Locale],
): string {
  if (!start && !end) {
    return copy.hiddenOrMissing;
  }

  return `${start ?? copy.unknown} → ${end ?? copy.present}`;
}

function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en", {
    dateStyle: "medium",
  }).format(new Date(value));
}
