import Link from "next/link";

import {
  localizedHref,
  nextLocale,
  type Locale,
} from "@/lib/i18n";

export function LanguageSwitcher({
  locale,
  path,
  variant = "light",
}: {
  locale: Locale;
  path: string;
  variant?: "light" | "dark";
}) {
  const targetLocale = nextLocale(locale);
  const label = targetLocale === "ja" ? "日本語" : "English";
  const className =
    variant === "dark"
      ? "rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
      : "rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2";

  return (
    <Link
      href={localizedHref(path, targetLocale)}
      hrefLang={targetLocale}
      className={className}
    >
      {label}
    </Link>
  );
}
