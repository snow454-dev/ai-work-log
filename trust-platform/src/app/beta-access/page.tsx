import Link from "next/link";
import type { Metadata } from "next";

import { BetaAccessRequestForm } from "@/components/beta-access-request-form";
import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";
import {
  betaAccessIntents,
  type BetaAccessIntent,
} from "@/domain/beta-access-request";

type BetaAccessSearchParams = LocaleSearchParams & {
  intent?: string | string[];
  submitted?: string | string[];
};

const betaAccessPageCopy: Record<
  Locale,
  {
    signIn: string;
    badge: string;
    title: string;
    intro: string;
    successTitle: string;
    successBody: string;
    formTitle: string;
    formIntro: string;
    securityTitle: string;
    securityItems: string[];
    nextTitle: string;
    nextItems: string[];
  }
> = {
  en: {
    signIn: "Already invited? Sign in",
    badge: "Private beta access",
    title: "Request access to the Proofboard beta.",
    intro:
      "Tell us whether you are an AI developer or a company buyer, then start with one real AI solution workflow. We keep the cohort small so the trust loop stays safe and useful.",
    successTitle: "Request received",
    successBody:
      "Thanks. The beta team can now review your request and follow up through the work email you provided.",
    formTitle: "Start with one serious use case",
    formIntro:
      "No open checkout yet. This request is the controlled purchase-intent path for design partners and early AI builders.",
    securityTitle: "Why this intake is safe enough for beta",
    securityItems: [
      "The form stores only the access request needed for follow-up.",
      "Requests are not public and have no direct client read policies.",
      "Submitting this form does not expose company reviewer contacts or create public proof.",
    ],
    nextTitle: "What happens next",
    nextItems: [
      "We confirm the use case fits the private beta.",
      "If approved, your work email can be added to the beta allowlist.",
      "You verify one real AI solution before expanding usage.",
    ],
  },
  ja: {
    signIn: "招待済みの方はログイン",
    badge: "プライベートβアクセス",
    title: "Proofboardのβアクセスを申請する。",
    intro:
      "AI開発者として使うのか、企業側として使うのかを教えてください。まずは実際のAIソリューション案件1件から始め、信用ループを小さく安全に検証します。",
    successTitle: "申請を受け付けました",
    successBody:
      "ありがとうございます。βチームが内容を確認し、入力された仕事用メールへ連絡できる状態になりました。",
    formTitle: "最初の本気のユースケースから始める",
    formIntro:
      "まだオープンな即時決済ではありません。この申請が、デザインパートナーと初期AI開発者向けの管理された購入意思表示ルートです。",
    securityTitle: "この申請導線がβとして安全な理由",
    securityItems: [
      "保存するのは、β審査と連絡に必要な申請内容だけです。",
      "申請内容は公開されず、クライアントから直接読み取るポリシーもありません。",
      "このフォーム送信だけで企業確認担当者の連絡先が公開されたり、公開実績が作られたりすることはありません。",
    ],
    nextTitle: "次に起きること",
    nextItems: [
      "ユースケースがプライベートβに合うか確認します。",
      "承認後、仕事用メールをβ allowlist に追加できます。",
      "利用拡大の前に、実際のAIソリューション案件1件を検証します。",
    ],
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BetaAccessSearchParams>;
}): Promise<Metadata> {
  const locale = resolveLocale(await searchParams);
  const copy = betaAccessPageCopy[locale];

  return {
    title:
      locale === "ja"
        ? "βアクセス申請 | Proofboard"
        : "Request Beta Access | Proofboard",
    description: copy.intro,
  };
}

function resolveIntent(searchParams: BetaAccessSearchParams): BetaAccessIntent {
  const raw = Array.isArray(searchParams.intent)
    ? searchParams.intent[0]
    : searchParams.intent;

  return betaAccessIntents.includes(raw as BetaAccessIntent)
    ? (raw as BetaAccessIntent)
    : "developer";
}

function hasSubmitted(searchParams: BetaAccessSearchParams): boolean {
  const raw = Array.isArray(searchParams.submitted)
    ? searchParams.submitted[0]
    : searchParams.submitted;

  return raw === "1";
}

export default async function BetaAccessPage({
  searchParams,
}: {
  searchParams: Promise<BetaAccessSearchParams>;
}) {
  const query = await searchParams;
  const locale = resolveLocale(query);
  const copy = betaAccessPageCopy[locale];
  const initialIntent = resolveIntent(query);
  const submitted = hasSubmitted(query);

  return (
    <main lang={locale} className="min-h-dvh bg-[#f5f2ec] text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href={localizedHref("/", locale)} className="text-sm font-semibold">
            Proofboard
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path="/beta-access" />
            <Link
              href={localizedHref("/sign-in", locale)}
              className="rounded-full border border-zinc-300 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.signIn}
            </Link>
          </div>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="inline-flex rounded-full border border-zinc-300 bg-white/70 px-3 py-1 text-sm font-medium text-zinc-700">
              {copy.badge}
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-700 text-pretty">
              {copy.intro}
            </p>

            <InfoCard title={copy.securityTitle} items={copy.securityItems} />
            <InfoCard title={copy.nextTitle} items={copy.nextItems} />
          </div>

          <section className="rounded-[2rem] border border-zinc-300 bg-white p-6 shadow-sm md:p-8">
            {submitted ? (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <h2 className="text-lg font-semibold text-emerald-950">
                  {copy.successTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  {copy.successBody}
                </p>
              </div>
            ) : null}

            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {copy.formTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-700 text-pretty">
              {copy.formIntro}
            </p>
            <div className="mt-7">
              <BetaAccessRequestForm
                locale={locale}
                initialIntent={initialIntent}
              />
            </div>
          </section>
        </section>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="mt-8 rounded-[1.5rem] border border-zinc-300 bg-white/70 p-5">
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-zinc-700">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="font-semibold text-zinc-950">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
