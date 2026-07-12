import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHref, type Locale } from "@/lib/i18n";

const headerCopy: Record<Locale, { explore: string; companies: string; builders: string; list: string }> = {
  en: {
    explore: "Explore solutions",
    companies: "For companies",
    builders: "For builders",
    list: "List verified work",
  },
  ja: {
    explore: "実績を探す",
    companies: "企業向け",
    builders: "提供者向け",
    list: "検証済み実績を掲載",
  },
};

export function DiscoveryHeader({
  locale,
  path,
}: {
  locale: Locale;
  path: string;
}) {
  const copy = headerCopy[locale];

  return (
    <header className="border-b border-white/15 bg-[#0d0e0f] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 md:px-8">
        <Link
          href={localizedHref("/", locale)}
          className="text-sm font-black tracking-[0.16em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d7ff45]"
        >
          JISSEKI
        </Link>
        <nav
          aria-label={locale === "ja" ? "メインナビゲーション" : "Main navigation"}
          className="hidden items-center gap-6 text-xs text-zinc-300 md:flex"
        >
          <Link className="transition-colors hover:text-white" href={localizedHref("/solutions", locale)}>
            {copy.explore}
          </Link>
          <Link className="transition-colors hover:text-white" href={localizedHref("/companies", locale)}>
            {copy.companies}
          </Link>
          <Link className="transition-colors hover:text-white" href={localizedHref("/developers", locale)}>
            {copy.builders}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} path={path} variant="dark" />
          <Link
            href={localizedHref("/beta-access?intent=developer", locale)}
            className="hidden rounded-full border border-white/30 px-4 py-2 text-xs font-semibold transition-colors hover:border-[#d7ff45] hover:text-[#d7ff45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d7ff45] sm:inline-flex"
          >
            {copy.list}
          </Link>
        </div>
      </div>
    </header>
  );
}
