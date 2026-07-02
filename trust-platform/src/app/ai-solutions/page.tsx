import Link from "next/link";
import type { Metadata } from "next";

import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

const pageCopy: Record<
  Locale,
  {
    signIn: string;
    demo: string;
    badge: string;
    title: string;
    intro: string;
    primaryCta: string;
    secondaryCta: string;
    developerTitle: string;
    developerBody: string;
    companyTitle: string;
    companyBody: string;
    marketTitle: string;
    marketBody: string;
    businessTitle: string;
    businessChecks: string[];
    securityTitle: string;
    securityIntro: string;
    securityReasons: { title: string; body: string }[];
    caveatTitle: string;
    caveatBody: string;
    pricingTitle: string;
    pricingBody: string;
    plans: {
      name: string;
      price: string;
      body: string;
      points: string[];
      cta: string;
      href: string;
    }[];
    buyerTitle: string;
    buyerBody: string;
    buyerSteps: string[];
    finalTitle: string;
    finalBody: string;
  }
> = {
  en: {
    signIn: "Start beta",
    demo: "View demo",
    badge: "Private beta for AI solution work",
    title: "A reputation layer for AI developers companies can actually trust.",
    intro:
      "JISSEKI turns completed AI projects into company-approved proof. Strong builders earn more from verified outcomes; companies find credible AI engineers without cold-call reference chaos.",
    primaryCta: "Start beta",
    secondaryCta: "View proof demo",
    developerTitle: "For AI developers",
    developerBody:
      "Move beyond screenshots, marketplace stars, and self-written case studies. Ask the client company to verify the project, outcome, and what may be shared.",
    companyTitle: "For companies",
    companyBody:
      "Evaluate AI engineers through verified work history and consented reference paths before you spend budget on a risky engagement.",
    marketTitle: "Why this can scale",
    marketBody:
      "Like search or social ranking rewards strong content, JISSEKI is designed to reward verified AI work. Unverified claims stay weak; company-approved outcomes become discoverable proof.",
    businessTitle: "Business-use validation",
    businessChecks: [
      "AI developers get a repeatable way to raise close rates and pricing with verified outcomes.",
      "Companies reduce vendor-selection risk by seeing proof approved by a real company-domain reviewer.",
      "Reviewers keep control: they approve fields and opt into future reference paths instead of exposing private contact details.",
      "The loop can start from Upwork, サンカク, referrals, direct contracts, or future marketplaces.",
    ],
    securityTitle: "Why the beta security posture is acceptable",
    securityIntro:
      "No beta system should be called risk-free. For a controlled cohort, JISSEKI reduces the main abuse and privacy risks with these product and technical controls:",
    securityReasons: [
      {
        title: "Company-domain verification",
        body: "Project drafts require the reviewer email domain to match the company domain, reducing fake-reviewer risk.",
      },
      {
        title: "Scoped reviewer links and OTP",
        body: "Reviewers use invitation links plus OTP before submitting verification, and reviewer sessions are scoped to one request.",
      },
      {
        title: "Hashed opaque tokens",
        body: "Invitation, session, and receipt tokens are random and stored as hashes with server-side peppers, not as reusable plaintext secrets.",
      },
      {
        title: "Consent-gated public fields",
        body: "Only company-approved fields can be published. Reviewer contact details are not exposed to prospects.",
      },
      {
        title: "Private beta access gate",
        body: "Professional accounts can be restricted with BETA_ALLOWED_EMAILS, and deployment health fails when the allowlist is missing.",
      },
      {
        title: "Database access boundaries",
        body: "Supabase Row Level Security is enabled and forced on core tables; sensitive operations go through constrained server/RPC paths.",
      },
    ],
    caveatTitle: "Not yet open-public-launch ready",
    caveatBody:
      "Before broad launch, JISSEKI still needs counsel-reviewed terms, production monitoring, abuse operations, support SLAs, and security review. For known design partners, the current controls are appropriate for a small beta.",
    pricingTitle: "Simple beta offer",
    pricingBody:
      "Start with one verified AI project and one friendly company reviewer. Keep the cohort small until the reference loop is proven.",
    plans: [
      {
        name: "AI Developer beta",
        price: "Private beta",
        body: "Build a verified profile from completed AI solution work.",
        points: ["Verified project record", "Public proof page", "Reference request inbox"],
        cta: "Start as developer",
        href: "/beta-access?intent=developer",
      },
      {
        name: "Company buyer beta",
        price: "Design partner",
        body: "Use verified proof to find credible AI engineers.",
        points: ["Safer shortlist", "Consent-based reference path", "No reviewer contact exposure"],
        cta: "Start as company",
        href: "/beta-access?intent=company",
      },
    ],
    buyerTitle: "How buyers start safely",
    buyerBody:
      "This is a beta purchase path, not an open checkout yet. Start with one invited work email, one real AI project, and one company-domain reviewer before expanding spend.",
    buyerSteps: [
      "Choose the AI developer or company-buyer beta path.",
      "Sign in with an invited work email so access stays controlled.",
      "Verify one completed AI solution with a company-domain reviewer.",
      "Publish approved proof and route reference requests without exposing reviewer contact details.",
    ],
    finalTitle: "The goal is a cleaner AI services market.",
    finalBody:
      "Great AI builders should become easier to find. Weak claims should become harder to sell. JISSEKI is the simple trust layer between those two outcomes.",
  },
  ja: {
    signIn: "β導入を開始",
    demo: "デモを見る",
    badge: "AIソリューション実績のプライベートβ",
    title: "企業が本当に信頼できるAI開発者を見つけるための信用基盤。",
    intro:
      "JISSEKIは、完了したAI開発・AI導入案件を企業承認済みの実績に変えます。質の高いAI開発者は収益を上げやすくなり、企業は信頼できるAIエンジニアを見つけやすくなります。",
    primaryCta: "β導入を開始",
    secondaryCta: "実績デモを見る",
    developerTitle: "AI開発者側の価値",
    developerBody:
      "スクリーンショット、自己申告の事例、曖昧な評価だけに頼らず、顧客企業が確認した成果を営業資産にできます。",
    companyTitle: "企業側の価値",
    companyBody:
      "発注前に、会社ドメインで確認された実績と、同意に基づく紹介ルートを見て、AIエンジニア選定の失敗リスクを下げられます。",
    marketTitle: "伸びる設計",
    marketBody:
      "Google検索やInstagram、Threadsで質の高いコンテンツが注目されるように、JISSEKIでは検証済みのAI実績が信用として蓄積されます。未検証の主張は弱くなり、企業承認済みの成果が見つかりやすくなります。",
    businessTitle: "ビジネス利用の検証",
    businessChecks: [
      "AI開発者は、検証済み成果により受注率・単価・紹介獲得を上げる導線を持てます。",
      "企業は、会社ドメインの確認担当者が承認した実績を見て、外注先選定の不確実性を下げられます。",
      "確認担当者は、公開項目と将来の紹介依頼可否を自分で選べます。連絡先は勝手に公開されません。",
      "Upwork、サンカク、紹介、直接契約など、既存の案件獲得経路から始められます。",
    ],
    securityTitle: "セキュリティ上、β利用で問題ないと判断できる理由",
    securityIntro:
      "絶対に安全という意味ではありません。既知の少人数βで扱う範囲では、主要ななりすまし・情報公開・不正利用リスクを次の設計で下げています。",
    securityReasons: [
      {
        title: "企業ドメイン確認",
        body: "案件作成時に、確認担当者メールのドメインが企業ドメインと一致することを要求します。",
      },
      {
        title: "限定リンク + OTP",
        body: "企業確認者は招待リンクとOTPで確認画面に入り、セッションは対象リクエストに限定されます。",
      },
      {
        title: "トークンはハッシュ保存",
        body: "招待・セッション・控えリンクのトークンはランダム生成し、サーバー側pepper付きハッシュとして保存します。",
      },
      {
        title: "公開は同意された項目のみ",
        body: "公開実績に出るのは企業が承認した項目だけです。確認担当者の連絡先は見込み客に公開されません。",
      },
      {
        title: "βは招待制",
        body: "BETA_ALLOWED_EMAILSで利用者を制限でき、allowlist未設定の本番βはhealth checkで失敗します。",
      },
      {
        title: "DB境界",
        body: "主要テーブルでSupabase Row Level Securityを有効化・強制し、重要操作は制限されたserver/RPC経路に閉じています。",
      },
    ],
    caveatTitle: "まだ一般公開向けではない",
    caveatBody:
      "広く公開する前に、弁護士レビュー済み規約、監視、悪用対応、サポート体制、追加セキュリティレビューが必要です。既知のデザインパートナー向け小規模βとしては、現状の制御で開始可能と判断できます。",
    pricingTitle: "シンプルなβ導入",
    pricingBody:
      "まずはAI開発者1名、企業確認者1名、検証済み案件1件から始めます。紹介ループが成立するまで、参加者を絞って検証します。",
    plans: [
      {
        name: "AI開発者β",
        price: "プライベートβ",
        body: "完了したAIソリューション案件を、検証済みプロフィールに変える。",
        points: ["検証済み案件レコード", "公開実績ページ", "紹介依頼 inbox"],
        cta: "開発者として開始",
        href: "/beta-access?intent=developer",
      },
      {
        name: "企業側β",
        price: "デザインパートナー",
        body: "信頼できるAIエンジニアを、検証済み実績から探す。",
        points: ["安全な候補者選定", "同意ベースの紹介ルート", "確認担当者の連絡先非公開"],
        cta: "企業として開始",
        href: "/beta-access?intent=company",
      },
    ],
    buyerTitle: "安全に導入・購入検討を始める流れ",
    buyerBody:
      "現段階ではオープンな即時決済ではなく、招待制βの導入導線です。まずは仕事用メール1つ、実案件1件、企業ドメインの確認者1名から始め、支出を広げる前に信用ループを検証します。",
    buyerSteps: [
      "AI開発者β、または企業側βの導入経路を選ぶ。",
      "招待済みの仕事用メールでログインし、アクセス範囲を絞る。",
      "完了済みAIソリューション案件を、企業ドメインの確認者で検証する。",
      "承認済み実績を公開し、確認担当者の連絡先を出さずに紹介依頼を受ける。",
    ],
    finalTitle: "目指すのは、より健全なAIサービス市場です。",
    finalBody:
      "優れたAI開発者は見つかりやすく、弱い自己申告は売れにくくなる。その間に入るシンプルな信用レイヤーがJISSEKIです。",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}): Promise<Metadata> {
  const locale = resolveLocale(await searchParams);
  const copy = pageCopy[locale];
  const title =
    locale === "ja"
      ? "AI開発者・企業向け信用基盤 | JISSEKI"
      : "AI developer reputation and company buyer trust | JISSEKI";

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

export default async function AiSolutionsPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);
  const copy = pageCopy[locale];

  return (
    <main lang={locale} className="min-h-dvh bg-[#f5f2ec] text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href={localizedHref("/", locale)} className="text-sm font-semibold">
            JISSEKI
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path="/ai-solutions" />
            <Link
              href={localizedHref("/beta-access", locale)}
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.signIn}
            </Link>
          </div>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-zinc-300 bg-white/70 px-3 py-1 text-sm font-medium text-zinc-700">
              {copy.badge}
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight text-balance md:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-700 text-pretty">
              {copy.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={localizedHref("/beta-access", locale)}
                className="inline-flex justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                {copy.primaryCta}
              </Link>
              <Link
                href={localizedHref("/demo", locale)}
                className="inline-flex justify-center rounded-full border border-zinc-300 bg-white/70 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                {copy.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-300 bg-zinc-950 p-5 text-white shadow-2xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-amber-200">
                Verified AI work
              </p>
              <div className="mt-6 grid gap-3">
                <ProofLine label="01" text={copy.developerTitle} />
                <ProofLine label="02" text={copy.companyTitle} />
                <ProofLine label="03" text={copy.securityTitle} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ValueCard title={copy.developerTitle} body={copy.developerBody} />
          <ValueCard title={copy.companyTitle} body={copy.companyBody} />
          <ValueCard title={copy.marketTitle} body={copy.marketBody} />
        </section>

        <section className="mt-10 rounded-[2rem] border border-zinc-300 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {copy.businessTitle}
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {copy.businessChecks.map((item) => (
              <CheckItem key={item}>{item}</CheckItem>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] bg-zinc-950 p-6 text-white md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                {copy.securityTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-300 text-pretty">
                {copy.securityIntro}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {copy.securityReasons.map((reason) => (
                <SecurityCard
                  key={reason.title}
                  title={reason.title}
                  body={reason.body}
                />
              ))}
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
            <h3 className="text-sm font-semibold text-amber-100">
              {copy.caveatTitle}
            </h3>
            <p className="mt-2 text-sm leading-6 text-amber-50/80 text-pretty">
              {copy.caveatBody}
            </p>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {copy.pricingTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-700 text-pretty">
              {copy.pricingBody}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.plans.map((plan) => (
              <PlanCard
                key={plan.name}
                {...plan}
                href={localizedHref(plan.href, locale)}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-zinc-300 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                {copy.buyerTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-zinc-700 text-pretty">
                {copy.buyerBody}
              </p>
            </div>
            <ol className="grid gap-3 md:grid-cols-2">
              {copy.buyerSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                    Step {index + 1}
                  </span>
                  <p className="mt-2 text-sm leading-6 text-zinc-700 text-pretty">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-zinc-300 bg-white p-6 text-center shadow-sm md:p-8">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {copy.finalTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-700 text-pretty">
            {copy.finalBody}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={localizedHref("/beta-access", locale)}
              className="inline-flex justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={localizedHref("/demo", locale)}
              className="inline-flex justify-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.demo}
            </Link>
          </div>
        </section>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function ProofLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-zinc-950">
        {label}
      </span>
      <span className="text-sm font-medium text-white">{text}</span>
    </div>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-[1.5rem] border border-zinc-300 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-950">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-700 text-pretty">{body}</p>
    </article>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-7 text-zinc-700">
      <span className="mr-2 font-semibold text-zinc-950">✓</span>
      {children}
    </div>
  );
}

function SecurityCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-300 text-pretty">{body}</p>
    </article>
  );
}

function PlanCard({
  name,
  price,
  body,
  points,
  cta,
  href,
}: {
  name: string;
  price: string;
  body: string;
  points: string[];
  cta: string;
  href: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-zinc-300 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">{price}</p>
      <h3 className="mt-2 text-xl font-semibold text-zinc-950">{name}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-700 text-pretty">{body}</p>
      <ul className="mt-5 space-y-2 text-sm text-zinc-700">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="font-semibold text-zinc-950">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-6 inline-flex w-full justify-center rounded-full bg-zinc-950 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
      >
        {cta}
      </Link>
    </article>
  );
}
