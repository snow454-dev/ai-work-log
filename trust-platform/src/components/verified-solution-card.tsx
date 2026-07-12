import Link from "next/link";

import type { PublicSolutionListItem } from "@/data/public-solutions";
import { localizedHref, type Locale } from "@/lib/i18n";

function metricLabel(item: PublicSolutionListItem, locale: Locale): string | null {
  if (item.publicOutcomeMetricValue === null) {
    return null;
  }

  const value = new Intl.NumberFormat(locale).format(item.publicOutcomeMetricValue);
  return item.publicOutcomeMetricUnit
    ? `${value} ${item.publicOutcomeMetricUnit}`
    : value;
}

export function VerifiedSolutionCard({
  item,
  locale,
}: {
  item: PublicSolutionListItem;
  locale: Locale;
}) {
  const metric = metricLabel(item, locale);
  const detailHref = localizedHref(
    `/solutions/${encodeURIComponent(item.profileSlug)}/${item.id}`,
    locale,
  );

  return (
    <article className="group flex min-h-80 flex-col border-b border-zinc-300 bg-[#f3efe5] p-6 text-zinc-950 transition-colors hover:bg-white md:border-b-0 md:border-r md:last:border-r-0">
      <div className="flex items-start justify-between gap-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-zinc-600">
        <span>{item.publicServiceCategory}</span>
        <span className="whitespace-nowrap text-emerald-700">
          <span aria-hidden="true">●</span>{" "}
          {locale === "ja" ? "企業確認済み" : "Company verified"}
        </span>
      </div>
      <h3 className="mt-8 text-2xl font-semibold leading-tight tracking-[-0.035em] [font-family:var(--font-display)]">
        {item.publicTitle}
      </h3>
      {item.publicCompanyName ? (
        <p className="mt-3 text-sm text-zinc-600">
          {locale === "ja" ? "導入企業" : "Client"}: {item.publicCompanyName}
        </p>
      ) : null}
      <div className="mt-auto border-t border-zinc-300 pt-5">
        {metric ? (
          <p className="text-3xl font-black tracking-[-0.04em] text-[#a83f2a]">{metric}</p>
        ) : (
          <p className="text-sm text-zinc-600">
            {locale === "ja" ? "公開承認済みの実績" : "Approved public evidence"}
          </p>
        )}
        <div className="mt-5 flex items-center justify-between gap-4 text-xs">
          <span className="min-w-0 truncate font-semibold text-zinc-700">
            {item.providerDisplayName}
            {item.providerCountryCode ? ` · ${item.providerCountryCode}` : ""}
          </span>
          <Link
            href={detailHref}
            aria-label={`${item.publicTitle} — ${locale === "ja" ? "詳細を見る" : "View details"}`}
            className="grid size-9 shrink-0 place-items-center rounded-full bg-zinc-950 text-white transition-transform group-hover:translate-x-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
          >
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
