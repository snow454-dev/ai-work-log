import Link from "next/link";

import type { ParsedPublicSolutionSearch } from "@/domain/public-solution-search";
import { localizedHref, type Locale } from "@/lib/i18n";

const searchCopy: Record<
  Locale,
  {
    queryLabel: string;
    queryPlaceholder: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    countryLabel: string;
    countryPlaceholder: string;
    submit: string;
    queryTooLong: string;
    filterInvalid: string;
    suggestions: { label: string; query: string }[];
  }
> = {
  en: {
    queryLabel: "Business task or problem",
    queryPlaceholder: "Example: automate invoice processing",
    categoryLabel: "Solution category",
    categoryPlaceholder: "Example: Finance automation",
    countryLabel: "Provider country code",
    countryPlaceholder: "US",
    submit: "Find verified work",
    queryTooLong: "Use 100 characters or fewer.",
    filterInvalid: "This filter was reset. Check the value and try again.",
    suggestions: [
      { label: "Customer support", query: "customer support" },
      { label: "Sales automation", query: "sales automation" },
      { label: "Manufacturing", query: "manufacturing" },
      { label: "Recruiting", query: "recruiting" },
      { label: "Finance", query: "finance" },
    ],
  },
  ja: {
    queryLabel: "解決したい業務・課題",
    queryPlaceholder: "例：見積作成を自動化したい",
    categoryLabel: "ソリューションカテゴリ",
    categoryPlaceholder: "例：経理自動化",
    countryLabel: "提供者の国コード",
    countryPlaceholder: "JP",
    submit: "検証済み実績を探す",
    queryTooLong: "100文字以内で入力してください。",
    filterInvalid: "無効な条件を解除しました。入力内容を確認してください。",
    suggestions: [
      { label: "問い合わせ対応", query: "問い合わせ対応" },
      { label: "営業自動化", query: "営業自動化" },
      { label: "製造・検品", query: "製造" },
      { label: "採用", query: "採用" },
      { label: "経理", query: "経理" },
    ],
  },
};

export function SolutionSearchForm({
  locale,
  search,
  expanded = false,
}: {
  locale: Locale;
  search?: ParsedPublicSolutionSearch;
  expanded?: boolean;
}) {
  const copy = searchCopy[locale];
  const queryError = search?.errors.query ? copy.queryTooLong : undefined;
  const filterError =
    search?.errors.category || search?.errors.country || search?.errors.page
      ? copy.filterInvalid
      : undefined;

  return (
    <div>
      <form
        action="/solutions"
        method="get"
        className={
          expanded
            ? "grid gap-4 rounded-3xl border border-zinc-300 bg-white p-5 shadow-[0_18px_60px_rgba(20,20,20,0.08)] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_9rem_auto]"
            : "grid gap-2 rounded-2xl bg-white p-2 text-zinc-950 shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:grid-cols-[1fr_auto]"
        }
      >
        {locale === "ja" ? <input type="hidden" name="lang" value="ja" /> : null}
        <div>
          <label
            htmlFor={expanded ? "solution-query-expanded" : "solution-query"}
            className={expanded ? "mb-2 block text-xs font-bold text-zinc-700" : "sr-only"}
          >
            {copy.queryLabel}
          </label>
          <input
            id={expanded ? "solution-query-expanded" : "solution-query"}
            name="q"
            type="search"
            defaultValue={search?.formQuery ?? ""}
            placeholder={copy.queryPlaceholder}
            maxLength={101}
            aria-invalid={Boolean(queryError)}
            aria-describedby={queryError ? "solution-query-error" : undefined}
            className="min-h-12 w-full rounded-xl border border-transparent bg-white px-4 text-sm outline-none placeholder:text-zinc-500 focus-visible:border-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-950/15"
          />
        </div>
        {expanded ? (
          <>
            <div>
              <label htmlFor="solution-category" className="mb-2 block text-xs font-bold text-zinc-700">
                {copy.categoryLabel}
              </label>
              <input
                id="solution-category"
                name="category"
                defaultValue={search?.category ?? ""}
                placeholder={copy.categoryPlaceholder}
                maxLength={121}
                className="min-h-12 w-full rounded-xl border border-zinc-300 px-3 text-sm outline-none focus-visible:border-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-950/15"
              />
            </div>
            <div>
              <label htmlFor="solution-country" className="mb-2 block text-xs font-bold text-zinc-700">
                {copy.countryLabel}
              </label>
              <input
                id="solution-country"
                name="country"
                defaultValue={search?.country ?? ""}
                placeholder={copy.countryPlaceholder}
                inputMode="text"
                maxLength={2}
                autoCapitalize="characters"
                className="min-h-12 w-full rounded-xl border border-zinc-300 px-3 text-sm uppercase outline-none focus-visible:border-zinc-950 focus-visible:ring-2 focus-visible:ring-zinc-950/15"
              />
            </div>
          </>
        ) : null}
        <button
          type="submit"
          className="min-h-12 rounded-xl bg-[#d7ff45] px-5 text-sm font-black text-zinc-950 transition-transform hover:-translate-y-0.5 hover:bg-[#e2ff78] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          {copy.submit} <span aria-hidden="true">→</span>
        </button>
      </form>
      {queryError ? (
        <p
          id="solution-query-error"
          role="alert"
          className={`mt-2 text-sm ${expanded ? "text-red-700" : "text-red-300"}`}
        >
          {queryError}
        </p>
      ) : null}
      {filterError ? (
        <p
          role="status"
          className={`mt-2 text-sm ${expanded ? "text-amber-800" : "text-amber-200"}`}
        >
          {filterError}
        </p>
      ) : null}
      {!expanded ? (
        <nav aria-label={locale === "ja" ? "よく検索される課題" : "Suggested searches"} className="mt-4 flex flex-wrap gap-2">
          {copy.suggestions.map((suggestion) => (
            <Link
              key={suggestion.query}
              href={localizedHref(`/solutions?q=${encodeURIComponent(suggestion.query)}`, locale)}
              className="rounded-full border border-white/25 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[#d7ff45] hover:text-[#d7ff45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d7ff45]"
            >
              {suggestion.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
