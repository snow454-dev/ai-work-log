import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscoveryHeader } from "@/components/discovery-header";
import { LightLegalFooter } from "@/components/legal-footer";
import { VerificationExplainer } from "@/components/verification-explainer";
import { getOptionalUserId } from "@/data/auth";
import { getPublicSolution } from "@/data/public-solutions";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

type DetailParams = { profileSlug: string; evidenceId: string };

function detailPath(params: DetailParams) {
  return `/solutions/${encodeURIComponent(params.profileSlug)}/${encodeURIComponent(params.evidenceId)}`;
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<DetailParams>;
  searchParams: Promise<LocaleSearchParams>;
}): Promise<Metadata> {
  const [route, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(query);
  const solution = await getPublicSolution(route.profileSlug, route.evidenceId);

  if (!solution) {
    return { title: locale === "ja" ? "実績が見つかりません" : "Solution not found" };
  }

  const description =
    locale === "ja"
      ? `${solution.providerDisplayName}による企業確認済みAI実績。`
      : `Company-verified AI work delivered by ${solution.providerDisplayName}.`;
  const canonical = detailPath(route);

  return {
    title: solution.publicTitle,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: solution.publicTitle,
      description,
      url: canonical,
      publishedTime: solution.publishedAt,
    },
  };
}

function formattedMetric(value: number | null, unit: string | null, locale: Locale) {
  if (value === null) return null;
  const number = new Intl.NumberFormat(locale).format(value);
  return unit ? `${number} ${unit}` : number;
}

function formattedDate(value: string | null, locale: Locale) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short" }).format(new Date(`${value}T00:00:00Z`));
}

export default async function SolutionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<DetailParams>;
  searchParams: Promise<LocaleSearchParams>;
}) {
  const [route, query] = await Promise.all([params, searchParams]);
  const locale = resolveLocale(query);
  const [solution, userId] = await Promise.all([
    getPublicSolution(route.profileSlug, route.evidenceId),
    getOptionalUserId(),
  ]);

  if (!solution) notFound();

  const isMember = Boolean(userId);

  const metric = formattedMetric(
    solution.publicOutcomeMetricValue,
    solution.publicOutcomeMetricUnit,
    locale,
  );
  const period = [
    formattedDate(solution.publicProjectStart, locale),
    formattedDate(solution.publicProjectEnd, locale),
  ].filter(Boolean).join(" – ");
  const canonical = detailPath(route);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: solution.publicTitle,
    datePublished: solution.publishedAt,
    inLanguage: locale,
    author: { "@type": "Person", name: solution.providerDisplayName },
    description: locale === "ja" ? "企業確認済みAI実績" : "Company-verified AI work",
    mainEntityOfPage: `https://jisseki.io${canonical}`,
  };

  return (
    <main lang={locale} className="min-h-dvh bg-[#f3efe5] text-zinc-950">
      <DiscoveryHeader locale={locale} path={canonical} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <article>
        <header className="grid border-b border-zinc-300 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="min-w-0 border-b border-zinc-300 px-5 py-14 lg:border-b-0 lg:border-r lg:px-10 lg:py-20 xl:px-16">
            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-600">
              <span>{solution.publicServiceCategory}</span>
              {solution.providerCountryCode ? <span>· {solution.providerCountryCode}</span> : null}
            </div>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-800">
              <span aria-hidden="true">●</span>
              {locale === "ja" ? "企業ドメイン確認済み" : "Company-domain verified"}
            </p>
            <h1 className="mt-6 max-w-5xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-balance [font-family:var(--font-display)] md:text-7xl">
              {solution.publicTitle}
            </h1>
            <p className="mt-7 text-sm text-zinc-600">
              {locale === "ja" ? "提供者" : "Provider"}:{" "}
              <Link className="font-bold text-zinc-950 underline underline-offset-4" href={localizedHref(`/p/${solution.profileSlug}`, locale)}>
                {solution.providerDisplayName}
              </Link>
            </p>
          </div>
          <aside className="min-w-0 flex flex-col justify-between bg-[#a83f2a] p-8 text-white lg:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-100">Approved outcome</p>
            {metric ? (
              <p className="my-10 text-4xl font-black tracking-[-0.05em] [overflow-wrap:anywhere] sm:text-5xl md:text-7xl">{metric}</p>
            ) : (
              <p className="my-10 text-3xl font-semibold leading-tight tracking-[-0.04em] [font-family:var(--font-display)]">
                {locale === "ja" ? "公開承認済みの実績" : "Approved public evidence"}
              </p>
            )}
            <p className="text-sm leading-6 text-orange-50">
              {locale === "ja" ? "表示内容は、顧客企業が公開を承認した範囲に限定されています。" : "This page is limited to fields the client approved for publication."}
            </p>
          </aside>
        </header>

        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-14 lg:grid-cols-[1fr_20rem] lg:px-10 xl:px-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] [font-family:var(--font-display)]">
              {locale === "ja" ? "検証済みの公開内容" : "Verified public evidence"}
            </h2>
            <dl className="mt-7 divide-y divide-zinc-300 border-y border-zinc-300">
              {isMember && solution.publicOutcomeStatement ? <EvidenceRow label={locale === "ja" ? "成果" : "Outcome"} value={solution.publicOutcomeStatement} /> : null}
              {solution.publicCompanyName ? <EvidenceRow label={locale === "ja" ? "導入企業" : "Client"} value={solution.publicCompanyName} /> : null}
              {period ? <EvidenceRow label={locale === "ja" ? "実施期間" : "Project period"} value={period} /> : null}
              {isMember && solution.publicReviewerComment ? <EvidenceRow label={locale === "ja" ? "確認担当者コメント" : "Reviewer comment"} value={solution.publicReviewerComment} /> : null}
              {isMember && solution.publicRehireResponse ? <EvidenceRow label={locale === "ja" ? "再依頼意向" : "Would work together again"} value={solution.publicRehireResponse} /> : null}
            </dl>
            {!isMember && (solution.publicOutcomeStatement || solution.publicReviewerComment || solution.publicRehireResponse) ? (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
                <h3 className="font-bold">{locale === "ja" ? "会員限定の案件詳細" : "Member-only project details"}</h3>
                <p className="mt-2 text-sm leading-6">{locale === "ja" ? "無料登録またはログインすると、企業が承認した成果文章と確認担当者コメントを確認できます。" : "Sign in to view approved outcome details and reviewer comments."}</p>
                <Link href={signInHref(localizedHref(canonical, locale), locale)} className="mt-4 inline-flex rounded-full bg-blue-950 px-4 py-2 text-sm font-bold text-white">
                  {locale === "ja" ? "ログインして詳細を見る" : "Sign in to view details"}
                </Link>
              </div>
            ) : null}
          </div>
          <aside className="rounded-3xl bg-zinc-950 p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d7ff45]">
              {locale === "ja" ? "次のステップ" : "Next step"}
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight [font-family:var(--font-display)]">
              {solution.publicReferenceAvailable
                ? locale === "ja" ? "この提供者へ導入相談を送る。" : "Ask the provider about implementation."
                : locale === "ja" ? "提供者の実績プロフィールを見る。" : "Review the provider profile."}
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-300">
              {solution.publicReferenceAvailable
                ? locale === "ja" ? "相談はまず提供者へ届きます。確認担当者の連絡先は公開されません。" : "The request goes to the provider first. Reviewer contact details stay private."
                : locale === "ja" ? "この実績では紹介依頼が公開されていません。" : "A reference path is not public for this record."}
            </p>
            <Link
              href={
                solution.publicReferenceAvailable && !isMember
                  ? signInHref(
                      localizedHref(`/p/${solution.profileSlug}/reference/${solution.id}`, locale),
                      locale,
                    )
                  : localizedHref(
                      solution.publicReferenceAvailable
                        ? `/p/${solution.profileSlug}/reference/${solution.id}`
                        : `/p/${solution.profileSlug}`,
                      locale,
                    )
              }
              className="mt-6 inline-flex rounded-full bg-[#d7ff45] px-5 py-3 text-sm font-black text-zinc-950 hover:bg-[#e2ff78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {solution.publicReferenceAvailable
                ? locale === "ja" ? "導入相談・紹介依頼" : "Implementation inquiry"
                : locale === "ja" ? "プロフィールを見る" : "View provider profile"}
            </Link>
          </aside>
        </section>
      </article>

      <VerificationExplainer locale={locale} />
      <div className="mx-auto max-w-7xl px-5 lg:px-10 xl:px-16">
        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function signInHref(next: string, locale: Locale): string {
  const params = new URLSearchParams({ next });
  if (locale !== "en") params.set("lang", locale);
  return `/sign-in?${params.toString()}`;
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr]">
      <dt className="text-xs font-black uppercase tracking-[0.12em] text-zinc-500">{label}</dt>
      <dd className="text-sm leading-7 text-zinc-800">{value}</dd>
    </div>
  );
}
