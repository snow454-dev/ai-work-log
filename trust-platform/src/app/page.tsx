import Link from "next/link";
import type { Metadata } from "next";

import { DiscoveryHeader } from "@/components/discovery-header";
import { DarkLegalFooter } from "@/components/legal-footer";
import { SolutionSearchForm } from "@/components/solution-search-form";
import { VerificationExplainer } from "@/components/verification-explainer";
import { VerifiedSolutionGrid } from "@/components/verified-solution-grid";
import { searchPublicSolutions } from "@/data/public-solutions";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

const homeCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    featured: string;
    featuredLink: string;
    companyEyebrow: string;
    companyTitle: string;
    companyBody: string;
    companyCta: string;
    builderEyebrow: string;
    builderTitle: string;
    builderBody: string;
    builderCta: string;
    metaTitle: string;
    metaDescription: string;
  }
> = {
  en: {
    eyebrow: "Verified outcomes · Global providers",
    title: "Find AI by the business problem it already solved.",
    intro:
      "Search company-approved outcomes from independent builders, small businesses, and product studios. Evaluate the proof before contacting the provider.",
    featured: "Featured verified work",
    featuredLink: "Explore all solutions",
    companyEyebrow: "For companies",
    companyTitle: "Start with evidence, not a sales promise.",
    companyBody:
      "See who solved a similar task, what the client approved for publication, and whether a reference path is available.",
    companyCta: "Describe your problem",
    builderEyebrow: "For builders and SMBs",
    builderTitle: "Turn one successful AI project into global reach.",
    builderBody:
      "Verify the outcome with the client, publish the approved fields, and let companies discover the work across borders.",
    builderCta: "List verified work",
    metaTitle: "Find verified AI solutions",
    metaDescription:
      "Search AI solutions by the business problems they solved and the outcomes client companies approved for publication.",
  },
  ja: {
    eyebrow: "企業確認済みの成果 · 世界中の提供者",
    title: "解決したい業務から、実証済みAIを探す。",
    intro:
      "個人開発者、中小企業、プロダクトスタジオが現場で生み出したAI成果を検索。営業文句より先に、顧客企業が公開を承認した実績を確認できます。",
    featured: "注目の検証済み実績",
    featuredLink: "すべての実績を見る",
    companyEyebrow: "企業向け",
    companyTitle: "営業文句ではなく、実績から始める。",
    companyBody:
      "同じ課題を誰が解決し、顧客企業が何を公開承認し、紹介ルートが利用可能かを確認できます。",
    companyCta: "解決したい課題を相談",
    builderEyebrow: "開発者・中小企業向け",
    builderTitle: "一つのAI成功事例を、世界へ届く営業資産に。",
    builderBody:
      "顧客企業に成果を確認してもらい、承認済み項目を公開。国境を越えて企業から発見される実績に変えます。",
    builderCta: "検証済み実績を掲載",
    metaTitle: "検証済みAIソリューションを探す",
    metaDescription:
      "解決したい業務と、顧客企業が公開を承認した成果からAIソリューションを探せます。",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}): Promise<Metadata> {
  const locale = resolveLocale(await searchParams);
  const copy = homeCopy[locale];

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    alternates: { canonical: "/" },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: "/",
    },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);
  const copy = homeCopy[locale];
  const { featured, featuredFailed } = await searchPublicSolutions({
    query: null,
    category: null,
    country: null,
    limit: 3,
    offset: 0,
  }).then(
    (result) => ({ featured: result, featuredFailed: false }),
    () => ({
      featured: { items: [], totalCount: 0 },
      featuredFailed: true,
    }),
  );

  return (
    <main lang={locale} className="min-h-dvh bg-[#0d0e0f] text-white">
      <DiscoveryHeader locale={locale} path="/" />

      <section className="grid border-b border-white/15 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border-b border-white/15 px-5 py-16 lg:border-b-0 lg:border-r lg:px-10 lg:py-24 xl:px-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7ff45]">{copy.eyebrow}</p>
          <h1 className="mt-6 max-w-5xl text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-balance [font-family:var(--font-display)] md:text-7xl xl:text-8xl">
            {copy.title}
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">{copy.intro}</p>
          <div className="mt-9 max-w-3xl">
            <SolutionSearchForm locale={locale} />
          </div>
        </div>

        <div className="relative flex min-h-80 flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_85%_25%,rgba(215,255,69,0.13),transparent_34%),linear-gradient(145deg,#17191b,#0d0e0f)] p-8 lg:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Every result includes</p>
          <p className="max-w-xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-balance [font-family:var(--font-display)] md:text-5xl">
            {locale === "ja" ? "自己申告ではなく、顧客企業が確認した成果。" : "Client-approved outcomes, not self-authored claims."}
          </p>
          <div className="mt-10 divide-y divide-white/15 border-y border-white/15 text-sm text-zinc-300">
            {[
              locale === "ja" ? "企業ドメインで事実確認" : "Company-domain review",
              locale === "ja" ? "公開範囲は顧客企業が決定" : "Client-controlled public fields",
              locale === "ja" ? "提供者と紹介可否を明示" : "Provider and reference availability",
            ].map((item) => (
              <p key={item} className="flex items-center gap-3 py-4">
                <span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-emerald-950 text-emerald-300">✓</span>
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f3efe5] px-5 py-14 text-zinc-950 lg:px-10 xl:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-7 flex items-end justify-between gap-6">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] [font-family:var(--font-display)] md:text-5xl">{copy.featured}</h2>
            <Link
              href={localizedHref("/solutions", locale)}
              className="hidden text-sm font-bold underline decoration-zinc-400 underline-offset-4 hover:decoration-zinc-950 sm:block"
            >
              {copy.featuredLink} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <VerifiedSolutionGrid items={featured.items} locale={locale} failed={featuredFailed} />
        </div>
      </section>

      <VerificationExplainer locale={locale} />

      <section className="grid border-b border-white/15 lg:grid-cols-2">
        <article className="border-b border-white/15 p-8 lg:border-b-0 lg:border-r lg:p-12 xl:p-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d7ff45]">{copy.companyEyebrow}</p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] [font-family:var(--font-display)] md:text-5xl">{copy.companyTitle}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300">{copy.companyBody}</p>
          <Link
            href={localizedHref("/beta-access?intent=company", locale)}
            className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-zinc-950 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d7ff45]"
          >
            {copy.companyCta} <span aria-hidden="true">→</span>
          </Link>
        </article>
        <article className="p-8 lg:p-12 xl:p-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ff7448]">{copy.builderEyebrow}</p>
          <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-[-0.04em] [font-family:var(--font-display)] md:text-5xl">{copy.builderTitle}</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-300">{copy.builderBody}</p>
          <Link
            href={localizedHref("/beta-access?intent=developer", locale)}
            className="mt-7 inline-flex rounded-full border border-white/30 px-5 py-3 text-sm font-black text-white transition-colors hover:border-[#ff7448] hover:text-[#ff9c7d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7448]"
          >
            {copy.builderCta} <span aria-hidden="true">→</span>
          </Link>
        </article>
      </section>

      <div className="mx-auto max-w-7xl px-5 lg:px-10 xl:px-16">
        <DarkLegalFooter locale={locale} />
      </div>
    </main>
  );
}
