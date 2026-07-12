import Link from "next/link";
import type { Metadata } from "next";

import { DiscoveryHeader } from "@/components/discovery-header";
import { LightLegalFooter } from "@/components/legal-footer";
import { SolutionFilters } from "@/components/solution-filters";
import { SolutionSearchForm } from "@/components/solution-search-form";
import { VerifiedSolutionGrid } from "@/components/verified-solution-grid";
import { searchPublicSolutions } from "@/data/public-solutions";
import {
  parsePublicSolutionSearchParams,
  type PublicSolutionSearchParams,
} from "@/domain/public-solution-search";
import {
  localizedHref,
  resolveLocale,
  type LocaleSearchParams,
} from "@/lib/i18n";

type SearchParams = PublicSolutionSearchParams & LocaleSearchParams;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const locale = resolveLocale(params);
  const search = parsePublicSolutionSearchParams(params);
  const hasFilters = Boolean(
    search.query || search.category || search.country || search.page > 1,
  );
  const title = search.query
    ? locale === "ja"
      ? `「${search.query}」の検証済みAI実績`
      : `Verified AI work for “${search.query}”`
    : locale === "ja"
      ? "検証済みAIソリューション"
      : "Verified AI solutions";

  return {
    title,
    description:
      locale === "ja"
        ? "顧客企業が公開を承認した成果からAIソリューションを検索できます。"
        : "Search AI solutions through outcomes client companies approved for publication.",
    robots: { index: !hasFilters, follow: true },
    alternates: { canonical: "/solutions" },
  };
}

function solutionPageHref(
  search: ReturnType<typeof parsePublicSolutionSearchParams>,
  page: number,
  locale: "en" | "ja",
) {
  const params = new URLSearchParams();
  if (search.query) params.set("q", search.query);
  if (search.category) params.set("category", search.category);
  if (search.country) params.set("country", search.country);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return localizedHref(`/solutions${query ? `?${query}` : ""}`, locale);
}

export default async function SolutionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = resolveLocale(params);
  const search = parsePublicSolutionSearchParams(params);
  const { result, failed } = await searchPublicSolutions(search).then(
    (value) => ({ result: value, failed: false }),
    () => ({ result: { items: [], totalCount: 0 }, failed: true }),
  );
  const firstResult = result.totalCount === 0 ? 0 : search.offset + 1;
  const lastResult = Math.min(search.offset + result.items.length, result.totalCount);
  const hasPrevious = search.page > 1;
  const hasNext = search.offset + search.limit < result.totalCount;

  return (
    <main lang={locale} className="min-h-dvh bg-[#f3efe5] text-zinc-950">
      <DiscoveryHeader locale={locale} path="/solutions" />
      <section className="border-b border-zinc-300 px-5 py-12 lg:px-10 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#a83f2a]">Verified solution discovery</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-[-0.05em] [font-family:var(--font-display)] md:text-6xl">
            {locale === "ja" ? "実績から、次のAI導入先を探す。" : "Find the next AI provider through proof."}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600">
            {locale === "ja" ? "検索対象は、公開中かつ企業確認済みの実績だけです。" : "Every result is active public evidence reviewed through a company-domain mailbox."}
          </p>
          <div className="mt-8">
            <SolutionSearchForm locale={locale} search={search} expanded />
          </div>
        </div>
      </section>

      <section className="px-5 py-10 lg:px-10 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-zinc-800" aria-live="polite">
                {failed
                  ? locale === "ja" ? "検索を完了できませんでした" : "Search unavailable"
                  : locale === "ja"
                    ? `${result.totalCount}件の検証済み実績`
                    : `${result.totalCount} verified result${result.totalCount === 1 ? "" : "s"}`}
              </p>
              {result.totalCount > 0 ? (
                <p className="mt-1 text-xs text-zinc-500">
                  {firstResult}–{lastResult}
                </p>
              ) : null}
            </div>
            <SolutionFilters locale={locale} search={search} />
          </div>

          <VerifiedSolutionGrid items={result.items} locale={locale} failed={failed} />

          {!failed && (hasPrevious || hasNext) ? (
            <nav aria-label={locale === "ja" ? "検索結果ページ" : "Search result pages"} className="mt-8 flex justify-between gap-4">
              {hasPrevious ? (
                <Link className="rounded-full border border-zinc-400 px-5 py-2.5 text-sm font-bold hover:bg-white" href={solutionPageHref(search, search.page - 1, locale)}>
                  ← {locale === "ja" ? "前へ" : "Previous"}
                </Link>
              ) : <span />}
              {hasNext ? (
                <Link className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800" href={solutionPageHref(search, search.page + 1, locale)}>
                  {locale === "ja" ? "次へ" : "Next"} →
                </Link>
              ) : null}
            </nav>
          ) : null}
          <LightLegalFooter locale={locale} />
        </div>
      </section>
    </main>
  );
}
