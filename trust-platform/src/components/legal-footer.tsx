import Link from "next/link";

import { localizedHref, type Locale } from "@/lib/i18n";

const footerCopy: Record<
  Locale,
  {
    notice: string;
    business: string;
    privacy: string;
    terms: string;
  }
> = {
  en: {
    notice: "© 2026 JISSEKI. Private beta.",
    business: "AI solutions",
    privacy: "Privacy",
    terms: "Terms",
  },
  ja: {
    notice: "© 2026 JISSEKI. プライベートβ版。",
    business: "AI導入",
    privacy: "プライバシー",
    terms: "利用規約",
  },
};

export function LightLegalFooter({ locale = "en" }: { locale?: Locale }) {
  const copy = footerCopy[locale];

  return (
    <footer className="mt-10 border-t border-zinc-200 py-6 text-sm text-zinc-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{copy.notice}</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link
            href={localizedHref("/ai-solutions", locale)}
            className="hover:text-zinc-950"
          >
            {copy.business}
          </Link>
          <Link
            href={localizedHref("/legal/privacy", locale)}
            className="hover:text-zinc-950"
          >
            {copy.privacy}
          </Link>
          <Link
            href={localizedHref("/legal/terms", locale)}
            className="hover:text-zinc-950"
          >
            {copy.terms}
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function DarkLegalFooter({ locale = "en" }: { locale?: Locale }) {
  const copy = footerCopy[locale];

  return (
    <footer className="border-t border-white/10 py-6 text-sm text-zinc-400">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{copy.notice}</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link
            href={localizedHref("/ai-solutions", locale)}
            className="hover:text-white"
          >
            {copy.business}
          </Link>
          <Link
            href={localizedHref("/legal/privacy", locale)}
            className="hover:text-white"
          >
            {copy.privacy}
          </Link>
          <Link
            href={localizedHref("/legal/terms", locale)}
            className="hover:text-white"
          >
            {copy.terms}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
