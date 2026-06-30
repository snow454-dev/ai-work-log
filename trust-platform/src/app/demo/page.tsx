import Link from "next/link";

import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

const demoCopy: Record<
  Locale,
  {
    badge: string;
    businessPage: string;
    heroEyebrow: string;
    name: string;
    headline: string;
    description: string;
    trustTitle: string;
    trustBody: string;
    verifiedProof: string;
    referencePaths: string;
    country: string;
    timeZone: string;
    tagAutomation: string;
    tagOperations: string;
    verifiedBadge: string;
    referenceBadge: string;
    projectTitle: string;
    published: string;
    clientCompany: string;
    sharedWithConsent: string;
    acquisitionSource: string;
    projectPeriod: string;
    outcomeMetric: string;
    outcomeValue: string;
    verifiedOutcome: string;
    verifiedOutcomeBody: string;
    referencePathTitle: string;
    referencePathBody: string;
    referenceCta: string;
    formEyebrow: string;
    formTitle: string;
    formIntro: string;
    yourName: string;
    workEmail: string;
    company: string;
    role: string;
    reason: string;
    reasonValue: string;
    optionalMessage: string;
    optionalMessageValue: string;
    consent: string;
    privacy: string;
    terms: string;
    submit: string;
  }
> = {
  en: {
    badge: "UI demo",
    businessPage: "Business page",
    heroEyebrow: "Company-approved proof for independent work",
    name: "Aiko Tanaka",
    headline:
      "AI automation consultant helping operations teams turn manual reporting into reliable internal workflows.",
    description:
      "This is a static preview of the public proof and reference request UI. It does not submit data.",
    trustTitle: "Trust boundary",
    trustBody:
      "Only company-approved fields are visible. Reviewer contact details stay private.",
    verifiedProof: "Verified proof",
    referencePaths: "Reference paths",
    country: "Country",
    timeZone: "Time zone",
    tagAutomation: "AI automation",
    tagOperations: "Operations",
    verifiedBadge: "Company-domain verified",
    referenceBadge: "Reference path available",
    projectTitle: "Reporting automation for weekly revenue operations",
    published: "Published Jun 28, 2026",
    clientCompany: "Client company",
    sharedWithConsent: "Shared with consent",
    acquisitionSource: "Acquisition source",
    projectPeriod: "Project period",
    outcomeMetric: "Outcome metric",
    outcomeValue: "18 hours/week saved",
    verifiedOutcome: "Verified outcome",
    verifiedOutcomeBody:
      "Automated weekly reporting and reduced manual spreadsheet work across the operations team.",
    referencePathTitle: "Structured reference path",
    referencePathBody:
      "The company reviewer allowed future reference requests to be routed through Proofboard. Contact details stay private unless a future request is explicitly accepted.",
    referenceCta: "Request reference path",
    formEyebrow: "Structured reference request",
    formTitle: "Ask for a consented reference path",
    formIntro:
      "This form sends the request to the professional first. It does not reveal or contact the company reviewer directly.",
    yourName: "Your name",
    workEmail: "Work email",
    company: "Company",
    role: "Role",
    reason: "Why are you requesting this reference?",
    reasonValue:
      "We are evaluating a similar reporting automation project and want to understand what the verified work looked like.",
    optionalMessage: "Optional message",
    optionalMessageValue:
      "If relevant, we would appreciate a short structured reference conversation.",
    consent:
      "I understand this request is shared with the professional first. Reviewer contact details are not exposed. Beta use is subject to the",
    privacy: "Privacy Notice",
    terms: "Terms",
    submit: "Submit reference request",
  },
  ja: {
    badge: "UIデモ",
    businessPage: "ビジネスページ",
    heroEyebrow: "個人の仕事を企業承認済みの実績へ",
    name: "田中 愛子",
    headline:
      "AI自動化コンサルタント。業務チームの手作業レポートを、信頼できる社内ワークフローに変えます。",
    description:
      "公開実績と紹介依頼フォームの静的プレビューです。この画面ではデータ送信は行いません。",
    trustTitle: "信頼の境界線",
    trustBody:
      "企業が承認した項目だけを表示します。確認担当者の連絡先は非公開のままです。",
    verifiedProof: "検証済み実績",
    referencePaths: "紹介依頼ルート",
    country: "国",
    timeZone: "タイムゾーン",
    tagAutomation: "AI自動化",
    tagOperations: "業務改善",
    verifiedBadge: "企業ドメイン確認済み",
    referenceBadge: "紹介依頼ルートあり",
    projectTitle: "週次売上オペレーションのレポート自動化",
    published: "公開日 2026年6月28日",
    clientCompany: "顧客企業",
    sharedWithConsent: "許可された範囲で共有",
    acquisitionSource: "獲得経路",
    projectPeriod: "プロジェクト期間",
    outcomeMetric: "成果指標",
    outcomeValue: "週18時間を削減",
    verifiedOutcome: "検証済み成果",
    verifiedOutcomeBody:
      "週次レポートを自動化し、業務チーム全体の手作業スプレッドシート作業を削減しました。",
    referencePathTitle: "構造化された紹介依頼ルート",
    referencePathBody:
      "企業の確認担当者は、Proofboard経由の将来的な紹介依頼を許可しています。今後の依頼が明示的に承認されるまで、連絡先は非公開です。",
    referenceCta: "紹介依頼を送る",
    formEyebrow: "構造化された紹介依頼",
    formTitle: "同意に基づく紹介ルートを依頼する",
    formIntro:
      "このフォームはまず本人に依頼を送ります。企業の確認担当者を直接表示したり、自動で連絡したりしません。",
    yourName: "お名前",
    workEmail: "仕事用メール",
    company: "会社名",
    role: "役職",
    reason: "紹介を依頼する理由",
    reasonValue:
      "同様のレポート自動化プロジェクトを検討しており、検証済みの実績内容を確認したいです。",
    optionalMessage: "任意メッセージ",
    optionalMessageValue:
      "可能であれば、短い構造化された紹介確認の機会を希望します。",
    consent:
      "この依頼はまず本人に共有され、確認担当者の連絡先は公開されないことを理解しています。β利用には",
    privacy: "プライバシー通知",
    terms: "利用規約",
    submit: "紹介依頼を送信",
  },
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);
  const copy = demoCopy[locale];

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-zinc-950">
            Proofboard
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path="/demo" />
            <Link
              href={localizedHref("/ai-solutions", locale)}
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.businessPage}
            </Link>
            <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              {copy.badge}
            </p>
          </div>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                {copy.heroEyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance md:text-5xl">
                {copy.name}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700 text-pretty">
                {copy.headline}
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600 text-pretty">
                {copy.description}
              </p>
            </div>

            <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <h2 className="text-sm font-semibold text-zinc-950">
                {copy.trustTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
                {copy.trustBody}
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <DemoMeta label={copy.verifiedProof} value="1" />
                <DemoMeta label={copy.referencePaths} value="1" />
                <DemoMeta label={copy.country} value="JP" />
                <DemoMeta label={copy.timeZone} value="Asia/Tokyo" />
              </dl>
            </aside>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            <li className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
              {copy.tagAutomation}
            </li>
            <li className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
              {copy.tagOperations}
            </li>
          </ul>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {copy.verifiedBadge}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {copy.referenceBadge}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                {copy.tagAutomation}
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-zinc-950 text-balance">
              {copy.projectTitle}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {copy.published}
            </p>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <DemoField
                label={copy.clientCompany}
                value={copy.sharedWithConsent}
              />
              <DemoField label={copy.acquisitionSource} value="Upwork" />
              <DemoField
                label={copy.projectPeriod}
                value="2026-02-01 → 2026-04-15"
              />
              <DemoField label={copy.outcomeMetric} value={copy.outcomeValue} />
            </dl>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="text-sm font-medium text-zinc-500">
                {copy.verifiedOutcome}
              </h3>
              <p className="mt-2 text-zinc-800 text-pretty">
                {copy.verifiedOutcomeBody}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="text-sm font-semibold text-zinc-950">
                {copy.referencePathTitle}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
                {copy.referencePathBody}
              </p>
              <a
                href="#reference-form"
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                {copy.referenceCta}
              </a>
            </div>
          </article>

          <section
            id="reference-form"
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">
              {copy.formEyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-950 text-balance">
              {copy.formTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
              {copy.formIntro}
            </p>

            <form className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <DemoInput label={copy.yourName} value="Mina Patel" />
                <DemoInput label={copy.workEmail} value="mina@example.com" />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <DemoInput label={copy.company} value="Future Works" />
                <DemoInput
                  label={copy.role}
                  value={locale === "ja" ? "業務責任者" : "Head of Operations"}
                />
              </div>
              <DemoTextArea
                label={copy.reason}
                value={copy.reasonValue}
              />
              <DemoTextArea
                label={copy.optionalMessage}
                value={copy.optionalMessageValue}
              />
              <label className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-950"
                />
                <span>
                  {copy.consent}{" "}
                  <Link
                    href={localizedHref("/legal/privacy", locale)}
                    className="underline"
                  >
                    {copy.privacy}
                  </Link>{" "}
                  {locale === "ja" ? "および" : "and"}{" "}
                  <Link
                    href={localizedHref("/legal/terms", locale)}
                    className="underline"
                  >
                    {copy.terms}
                  </Link>
                  {locale === "ja" ? "が適用されます。" : "."}
                </span>
              </label>
              <button
                type="button"
                className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
              >
                {copy.submit}
              </button>
            </form>
          </section>
        </section>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function DemoMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950 tabular-nums">{value}</dd>
    </div>
  );
}

function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-950 text-pretty">{value}</dd>
    </div>
  );
}

function DemoInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-zinc-900">
      {label}
      <input
        value={value}
        readOnly
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none"
      />
    </label>
  );
}

function DemoTextArea({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-zinc-900">
      {label}
      <textarea
        value={value}
        readOnly
        rows={4}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none"
      />
    </label>
  );
}
