import Link from "next/link";

import { VerifiedSolutionCard } from "@/components/verified-solution-card";
import type { PublicSolutionListItem } from "@/data/public-solutions";
import { localizedHref, type Locale } from "@/lib/i18n";

export function VerifiedSolutionGrid({
  items,
  locale,
  failed = false,
}: {
  items: PublicSolutionListItem[];
  locale: Locale;
  failed?: boolean;
}) {
  if (failed) {
    return (
      <div className="rounded-3xl border border-amber-300 bg-amber-50 p-8 text-amber-950" role="status">
        <h2 className="text-xl font-bold">
          {locale === "ja" ? "現在、実績を読み込めません" : "Verified work is temporarily unavailable"}
        </h2>
        <p className="mt-2 text-sm leading-6">
          {locale === "ja" ? "時間をおいて再度お試しいただくか、βアクセスから相談してください。" : "Try again shortly or tell us what you need through beta access."}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-300 bg-white p-8 text-zinc-950">
        <h2 className="text-2xl font-semibold tracking-tight [font-family:var(--font-display)]">
          {locale === "ja" ? "条件に合う実績は、まだ公開されていません" : "No verified work matches yet"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          {locale === "ja" ? "検索語を短くするか、企業向けβから解決したい課題をお知らせください。" : "Try a shorter search, or share the problem through the company beta path."}
        </p>
        <Link
          href={localizedHref("/beta-access?intent=company", locale)}
          className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-sm font-bold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          {locale === "ja" ? "企業向けβで相談する" : "Join the company beta"}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-zinc-300 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <VerifiedSolutionCard key={item.id} item={item} locale={locale} />
      ))}
    </div>
  );
}
