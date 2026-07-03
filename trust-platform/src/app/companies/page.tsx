import type { Metadata } from "next";

import { AudienceLanding, audienceCopy } from "@/components/audience-landing";
import { resolveLocale, type LocaleSearchParams } from "@/lib/i18n";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}): Promise<Metadata> {
  const locale = resolveLocale(await searchParams);
  const copy = audienceCopy.companies[locale];
  const title =
    locale === "ja"
      ? "企業向けAIエンジニア選定 | JISSEKI"
      : "Verified AI engineer discovery for companies | JISSEKI";

  return {
    title,
    description: copy.intro,
    openGraph: {
      title,
      description: copy.intro,
      type: "website",
    },
  };
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);

  return <AudienceLanding audience="companies" locale={locale} />;
}
