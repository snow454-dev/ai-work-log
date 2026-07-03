import type { Metadata } from "next";

import { AudienceLanding, audienceCopy } from "@/components/audience-landing";
import { resolveLocale, type LocaleSearchParams } from "@/lib/i18n";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}): Promise<Metadata> {
  const locale = resolveLocale(await searchParams);
  const copy = audienceCopy.developers[locale];
  const title =
    locale === "ja"
      ? "AI開発者向け検証済み実績 | JISSEKI"
      : "Verified proof for AI developers | JISSEKI";

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

export default async function DevelopersPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);

  return <AudienceLanding audience="developers" locale={locale} />;
}
