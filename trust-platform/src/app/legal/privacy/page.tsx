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
  title: "Beta Privacy Notice | Proofboard",
  description:
    "How Proofboard handles profile, project, company verification, and reference request data during the private beta.",
};

const privacyCopy: Record<
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
    updated: "Last updated June 28, 2026",
    title: "Beta Privacy Notice",
    intro:
      "Proofboard helps independent professionals turn completed client work into company-approved proof and consented reference paths. This notice explains the data handling model for the private beta. It is intended for early customer testing and should be reviewed by counsel before broad public launch.",
    sections: [
      {
        title: "What we collect",
        body: "We collect account details, professional profile information, project facts, company reviewer email addresses, reviewer verification responses, public proof settings, reference request submissions, audit events, and operational logs needed to run and secure the service.",
      },
      {
        title: "How we use data",
        body: "We use this data to authenticate users, create project records, send verification links, show only approved public proof, route reference requests to the professional first, prevent abuse, and support beta operations.",
      },
      {
        title: "What is public",
        body: "Public profiles show only fields that a company reviewer approved for sharing and that the professional chose to publish. Raw project notes, reviewer contact details, OTP tokens, and private request metadata are not shown on public proof pages.",
      },
      {
        title: "Reference requests",
        body: "When a prospect submits a reference request, the request is stored for the professional to review. The company reviewer is not contacted directly by the public form, and reviewer contact details are not exposed to the requester.",
      },
      {
        title: "Sharing and processors",
        body: "During beta, Proofboard may use infrastructure and email providers to host the product, store data, deliver transactional messages, and monitor reliability. We do not sell personal data.",
      },
      {
        title: "Retention and deletion",
        body: "Beta data is retained while the workspace is active and while it is needed for audit, security, or product operations. A participant may request deletion through the beta invitation channel, subject to legal, security, and audit constraints.",
      },
      {
        title: "Security model",
        body: "The beta uses authenticated workspaces, row-level access rules, scoped reviewer sessions, hashed verification tokens, audit events, and limited public fields. No beta system should be treated as a substitute for a signed contract, NDA, or formal reference agreement.",
      },
    ],
  },
  ja: {
    badge: "プライベートβ",
    updated: "最終更新日 2026年6月28日",
    title: "β版プライバシー通知",
    intro:
      "Proofboardは、個人事業者・フリーランスが完了した顧客案件を、企業承認済みの実績と同意に基づく紹介ルートに変えるためのサービスです。この通知はプライベートβにおけるデータ取扱いの考え方を説明するものです。正式公開前には専門家によるレビューを前提とします。",
    sections: [
      {
        title: "収集する情報",
        body: "アカウント情報、プロフィール情報、案件の事実情報、企業確認担当者のメールアドレス、確認結果、公開設定、紹介依頼、監査イベント、サービス運用と保護に必要なログを収集します。",
      },
      {
        title: "利用目的",
        body: "認証、案件記録の作成、確認リンクの送信、承認された公開実績の表示、本人への紹介依頼ルーティング、不正利用防止、β運用のために利用します。",
      },
      {
        title: "公開される情報",
        body: "公開プロフィールには、企業確認担当者が共有を承認し、本人が公開を選択した項目だけが表示されます。非公開の案件メモ、確認担当者の連絡先、OTPトークン、非公開の依頼メタデータは公開実績ページには表示されません。",
      },
      {
        title: "紹介依頼",
        body: "見込み顧客が紹介依頼を送信すると、その依頼はまず本人が確認できるよう保存されます。公開フォームから企業確認担当者へ直接連絡することはなく、確認担当者の連絡先も依頼者には公開されません。",
      },
      {
        title: "共有先と処理業者",
        body: "β期間中、Proofboardはホスティング、データ保存、メール配信、信頼性監視のためにインフラ事業者やメール事業者を利用する場合があります。個人データを販売することはありません。",
      },
      {
        title: "保持と削除",
        body: "βデータはワークスペースが有効である間、また監査・セキュリティ・運用上必要な期間保持されます。参加者はβ招待時の連絡経路を通じて削除を依頼できますが、法的・セキュリティ・監査上の制約を受ける場合があります。",
      },
      {
        title: "セキュリティモデル",
        body: "β版では、認証済みワークスペース、行レベルのアクセス制御、スコープ付き確認者セッション、ハッシュ化された確認トークン、監査イベント、限定された公開項目を利用します。βシステムは、契約書、NDA、正式な紹介契約の代替ではありません。",
      },
    ],
  },
};

export default async function PrivacyPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = resolveLocale(await searchParams);
  const copy = privacyCopy[locale];

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold">
            Proofboard
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path="/legal/privacy" />
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
              <PolicySection key={section.title} title={section.title}>
                <p>{section.body}</p>
              </PolicySection>
            ))}
          </div>
        </article>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function PolicySection({
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
