import Link from "next/link";

import { DarkLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

const homeCopy: Record<
  Locale,
  {
    signIn: string;
    eyebrow: string;
    title: string;
    intro: string;
    primaryCta: string;
    secondaryCta: string;
    businessCta: string;
    cardEyebrow: string;
    cardTitle: string;
    cardStatus: string;
    client: string;
    clientValue: string;
    origin: string;
    originValue: string;
    outcome: string;
    outcomeValue: string;
  }
> = {
  en: {
    signIn: "Sign in",
    eyebrow: "Verified proof for independent professionals",
    title: "Turn completed client work into company-approved proof.",
    intro:
      "Record work from Upwork, サンカク, referrals, direct contracts, or other platforms. The company verifies what is true and controls what can be shared publicly.",
    primaryCta: "Start with one project",
    secondaryCta: "Open dashboard",
    businessCta: "For AI builders and companies",
    cardEyebrow: "Company verified",
    cardTitle: "Reporting automation",
    cardStatus: "Approved",
    client: "Client",
    clientValue: "Shared with permission",
    origin: "Origin",
    originValue: "Upwork engagement",
    outcome: "Outcome",
    outcomeValue: "Saved 18 hours per week",
  },
  ja: {
    signIn: "ログイン",
    eyebrow: "個人事業者・フリーランスのための検証済み実績",
    title: "完了した受託実績を、企業承認済みの信用に変える。",
    intro:
      "Upwork、サンカク、紹介、直接契約などで完了した仕事を記録。企業は事実を確認し、公開してよい情報だけを承認できます。",
    primaryCta: "1件の実績から始める",
    secondaryCta: "ダッシュボードを開く",
    businessCta: "AI開発者・企業向けページ",
    cardEyebrow: "企業確認済み",
    cardTitle: "レポート自動化",
    cardStatus: "承認済み",
    client: "顧客企業",
    clientValue: "許可された範囲で共有",
    origin: "獲得経路",
    originValue: "Upwork経由の案件",
    outcome: "成果",
    outcomeValue: "週18時間の作業を削減",
  },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);
  const copy = homeCopy[locale];

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <p className="text-sm font-semibold">JISSEKI</p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={locale} path="/" variant="dark" />
            <Link
              href={localizedHref("/sign-in", locale)}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
            >
              {copy.signIn}
            </Link>
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-medium text-zinc-300">
              {copy.eyebrow}
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-balance md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 text-pretty">
              {copy.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={localizedHref("/beta-access", locale)}
                className="inline-flex justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                {copy.primaryCta}
              </Link>
              <Link
                href={localizedHref("/dashboard", locale)}
                className="inline-flex justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                {copy.secondaryCta}
              </Link>
              <Link
                href={localizedHref("/ai-solutions", locale)}
                className="inline-flex justify-center rounded-full border border-amber-200/40 px-5 py-3 text-sm font-medium text-amber-100 hover:bg-amber-200/10 focus:outline-none focus:ring-2 focus:ring-amber-100 focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                {copy.businessCta}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="rounded-2xl bg-white p-5 text-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    {copy.cardEyebrow}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    {copy.cardTitle}
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  {copy.cardStatus}
                </span>
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-zinc-500">{copy.client}</dt>
                  <dd className="font-medium">{copy.clientValue}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{copy.origin}</dt>
                  <dd className="font-medium">{copy.originValue}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">{copy.outcome}</dt>
                  <dd className="font-medium">{copy.outcomeValue}</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <DarkLegalFooter locale={locale} />
      </div>
    </main>
  );
}
