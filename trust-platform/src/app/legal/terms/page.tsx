import type { Metadata } from "next";
import Link from "next/link";

import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Beta Terms | Proofboard",
  description:
    "Private beta terms for using Proofboard to collect company-approved proof and consented reference requests.",
};

const termsCopy: Record<
  Locale,
  {
    badge: string;
    updated: string;
    title: string;
    intro: string;
    sections: Array<{ title: string; body: string }>;
  }
> = {
  en: {
    badge: "Private beta",
    updated: "Last updated June 30, 2026",
    title: "Beta Terms",
    intro:
      "These beta terms set expectations for invited users testing Proofboard. They are lightweight operating terms for early customer use and should be replaced with counsel-reviewed production terms before a broad public launch.",
    sections: [
      {
        title: "Private beta access",
        body: "Proofboard is currently invitation-only. Access may be limited, changed, paused, or revoked while the product is being tested and hardened.",
      },
      {
        title: "Beta access requests",
        body: "Submitting a beta access request does not guarantee access, pricing, support, or availability. Proofboard may prioritize requests that fit the current design-partner scope.",
      },
      {
        title: "Accurate submissions",
        body: "Professionals should submit only completed work they are authorized to describe. Company reviewers should verify only facts they are authorized to approve on behalf of their organization.",
      },
      {
        title: "Consent-controlled proof",
        body: "Public proof should include only fields approved by the company reviewer and published by the professional. Do not use the product to expose confidential, personal, regulated, or contract-restricted information.",
      },
      {
        title: "Reference requests",
        body: "A public reference request is a request to the professional first. It does not create an obligation for the professional or company reviewer to respond, endorse, contract, hire, or provide a live reference call.",
      },
      {
        title: "Acceptable use",
        body: "Do not submit spam, impersonate another person, probe private reviewer details, overload public forms, upload misleading work claims, or use Proofboard to harass customers, reviewers, prospects, or professionals.",
      },
      {
        title: "No professional advice",
        body: "Proofboard is a workflow and reputation product. It does not provide legal, tax, employment, procurement, or financial advice and does not replace direct contracts or due diligence.",
      },
      {
        title: "Beta availability",
        body: "The service may contain defects, incomplete workflows, and temporary outages during beta. Use it with known design partners first, and keep separate records for critical business decisions.",
      },
    ],
  },
  ja: {
    badge: "プライベートβ",
    updated: "最終更新日 2026年6月30日",
    title: "β版利用規約",
    intro:
      "このβ版利用規約は、招待ユーザーがProofboardを試験利用する際の前提を示すものです。初期顧客利用のための軽量な運用規約であり、広く一般公開する前には専門家レビュー済みの正式規約へ置き換える前提です。",
    sections: [
      {
        title: "プライベートβへのアクセス",
        body: "Proofboardは現在招待制です。プロダクトの検証と改善中は、アクセスが制限、変更、一時停止、または取り消される場合があります。",
      },
      {
        title: "βアクセス申請",
        body: "βアクセス申請の送信は、アクセス、価格、サポート、提供可否を保証するものではありません。Proofboardは現在のデザインパートナー範囲に合う申請を優先する場合があります。",
      },
      {
        title: "正確な提出",
        body: "本人は、説明する権限のある完了済み業務のみを提出してください。企業確認担当者は、組織を代表して承認する権限のある事実のみを確認してください。",
      },
      {
        title: "同意に基づく公開実績",
        body: "公開実績には、企業確認担当者が承認し、本人が公開した項目だけを含めてください。機密情報、個人情報、規制対象情報、契約で制限された情報を公開する目的で利用しないでください。",
      },
      {
        title: "紹介依頼",
        body: "公開フォームからの紹介依頼は、まず本人への依頼です。本人または企業確認担当者に、返信、推薦、契約、採用、ライブの紹介面談を義務づけるものではありません。",
      },
      {
        title: "許容される利用",
        body: "スパム、なりすまし、非公開の確認担当者情報の探索、公開フォームへの過剰送信、誤解を招く実績申告、顧客・確認担当者・見込み顧客・本人への嫌がらせにProofboardを使用しないでください。",
      },
      {
        title: "専門的助言ではありません",
        body: "Proofboardはワークフローおよび信用形成のためのプロダクトです。法務、税務、雇用、調達、金融に関する助言を提供するものではなく、直接契約やデューデリジェンスの代替ではありません。",
      },
      {
        title: "β版の提供状況",
        body: "β期間中、サービスには不具合、未完成のワークフロー、一時的な停止が含まれる場合があります。まず既知のデザインパートナーと利用し、重要な事業判断には別途記録を保持してください。",
      },
    ],
  },
};

export default async function TermsPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);
  const copy = termsCopy[locale];

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold">
            Proofboard
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path="/legal/terms" />
            <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              {copy.badge}
            </p>
          </div>
        </header>

        <article className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-zinc-500">
            {copy.updated}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance">
            {copy.title}
          </h1>
          <p className="mt-4 leading-7 text-zinc-600 text-pretty">
            {copy.intro}
          </p>

          <div className="mt-8 space-y-8">
            {copy.sections.map((section) => (
              <TermsSection key={section.title} title={section.title}>
                <p>{section.body}</p>
              </TermsSection>
            ))}
          </div>
        </article>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <div className="mt-2 leading-7 text-zinc-600 text-pretty">{children}</div>
    </section>
  );
}
