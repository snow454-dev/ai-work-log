import Link from "next/link";

import type { ParsedPublicSolutionSearch } from "@/domain/public-solution-search";
import { localizedHref, type Locale } from "@/lib/i18n";

export function SolutionFilters({
  locale,
  search,
}: {
  locale: Locale;
  search: ParsedPublicSolutionSearch;
}) {
  const active = [search.category, search.country].filter(Boolean);

  if (active.length === 0) {
    return null;
  }

  const query = search.query ? `?q=${encodeURIComponent(search.query)}` : "";

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={locale === "ja" ? "適用中の絞り込み" : "Active filters"}>
      {active.map((value) => (
        <span key={value} className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-semibold text-zinc-700">
          {value}
        </span>
      ))}
      <Link
        href={localizedHref(`/solutions${query}`, locale)}
        className="text-xs font-bold text-zinc-700 underline decoration-zinc-400 underline-offset-4 hover:text-zinc-950"
      >
        {locale === "ja" ? "絞り込みを解除" : "Clear filters"}
      </Link>
    </div>
  );
}
