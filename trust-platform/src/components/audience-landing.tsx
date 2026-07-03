import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { LightLegalFooter } from "@/components/legal-footer";
import { localizedHref, type Locale } from "@/lib/i18n";

export type AudienceKind = "developers" | "companies";

type AudienceCopy = {
  badge: string;
  title: string;
  intro: string;
  primaryCta: string;
  secondaryCta: string;
  proofTitle: string;
  proofBody: string;
  proofPoints: string[];
  stepsTitle: string;
  steps: string[];
  trustTitle: string;
  trustBody: string;
  trustPoints: string[];
  finalTitle: string;
  finalBody: string;
};

export const audienceCopy: Record<AudienceKind, Record<Locale, AudienceCopy>> = {
  developers: {
    en: {
      badge: "For AI developers",
      title: "Earn more from AI work companies already approved.",
      intro:
        "JISSEKI turns completed automation, agent, and AI implementation projects into company-approved proof you can reuse in sales, referrals, and future marketplace profiles.",
      primaryCta: "Apply as AI developer",
      secondaryCta: "See proof demo",
      proofTitle: "What you get",
      proofBody:
        "A simple trust asset that shows what was delivered, who verified it, and what may be shared publicly.",
      proofPoints: [
        "Verified project record",
        "Public proof page for approved fields",
        "Consent-based reference request path",
        "A cleaner signal than screenshots or self-written case studies",
      ],
      stepsTitle: "Start with one completed project",
      steps: [
        "Record the AI project and business outcome.",
        "Invite a company-domain reviewer to confirm the facts.",
        "Publish only the fields the company approved.",
        "Route future reference requests without exposing reviewer contact details.",
      ],
      trustTitle: "Why good developers benefit",
      trustBody:
        "The platform rewards verified delivery. Strong builders can compound trust; weak claims stay harder to sell.",
      trustPoints: [
        "Helps justify higher pricing with proof",
        "Turns satisfied customers into controlled reference paths",
        "Works after Upwork, サンカク, referrals, or direct contracts",
      ],
      finalTitle: "Build a reputation that survives outside any one marketplace.",
      finalBody:
        "Begin with one friendly client company and one verified AI project. Keep the loop small until it works.",
    },
    ja: {
      badge: "AI開発者向け",
      title: "企業が承認したAI実績で、受注率と単価を上げる。",
      intro:
        "JISSEKIは、完了した自動化・AIエージェント・AI導入案件を、企業承認済みの営業資産に変えます。営業、紹介、将来のマーケットプレイス評価に再利用できます。",
      primaryCta: "AI開発者として申請",
      secondaryCta: "実績デモを見る",
      proofTitle: "得られるもの",
      proofBody:
        "何を納品し、誰が確認し、どこまで公開できるかを示すシンプルな信用資産です。",
      proofPoints: [
        "検証済み案件レコード",
        "承認項目だけの公開実績ページ",
        "同意ベースの紹介依頼ルート",
        "スクリーンショットや自己申告事例より強い信用シグナル",
      ],
      stepsTitle: "まずは完了案件1件から",
      steps: [
        "AI案件とビジネス成果を記録する。",
        "企業ドメインの確認担当者へ事実確認を依頼する。",
        "企業が承認した項目だけを公開する。",
        "確認担当者の連絡先を公開せず、将来の紹介依頼を受ける。",
      ],
      trustTitle: "質の高い開発者が得をする理由",
      trustBody:
        "検証された納品実績が評価される設計です。強い開発者は信用を積み上げ、弱い自己申告は売れにくくなります。",
      trustPoints: [
        "検証済み成果で単価交渉をしやすくなる",
        "満足した顧客を、管理された紹介ルートに変えられる",
        "Upwork、サンカク、紹介、直接契約の後から使える",
      ],
      finalTitle: "特定のマーケットプレイスに閉じない信用を作る。",
      finalBody:
        "まずは協力的な顧客企業1社、検証済みAI案件1件から。ループが成立するまで小さく始めます。",
    },
  },
  companies: {
    en: {
      badge: "For companies",
      title: "Find AI engineers through verified outcomes, not sales claims.",
      intro:
        "JISSEKI gives buyers a safer way to evaluate AI developers: company-approved project facts, consented reference paths, and clear privacy boundaries before budget is committed.",
      primaryCta: "Apply as company buyer",
      secondaryCta: "Review demo proof",
      proofTitle: "What companies can evaluate",
      proofBody:
        "Use verified proof to shortlist AI engineers before relying on a pitch deck, cold references, or unstructured marketplace reviews.",
      proofPoints: [
        "Company-domain verified work history",
        "Approved outcomes and scope",
        "Consent-based reference request route",
        "Reviewer contact details remain private",
      ],
      stepsTitle: "A safer buyer flow",
      steps: [
        "Start from a verified AI project profile.",
        "Review approved scope, outcome, and company context.",
        "Request a reference through JISSEKI when needed.",
        "Move forward only when the professional and reviewer consent to the next step.",
      ],
      trustTitle: "Why this reduces vendor-selection risk",
      trustBody:
        "The system makes high-quality AI delivery more visible while keeping reviewers in control.",
      trustPoints: [
        "Shortlists are based on evidence, not just persuasion",
        "Reference requests are structured and consented",
        "Useful for agencies, startups, and departments buying AI work",
      ],
      finalTitle: "Buy AI work with a clearer trust signal.",
      finalBody:
        "The beta starts with known design partners and small purchase paths, not open public checkout.",
    },
    ja: {
      badge: "企業向け",
      title: "営業トークではなく、検証済み成果からAIエンジニアを探す。",
      intro:
        "JISSEKIは、AI開発者を選ぶ企業に、より安全な判断材料を提供します。発注前に、企業承認済みの案件情報、同意ベースの紹介ルート、明確なプライバシー境界を確認できます。",
      primaryCta: "企業として申請",
      secondaryCta: "実績デモを見る",
      proofTitle: "企業が確認できること",
      proofBody:
        "提案資料、突然の紹介依頼、構造化されていないレビューだけに頼らず、検証済み実績から候補者を絞れます。",
      proofPoints: [
        "会社ドメインで確認された実績履歴",
        "承認済みの成果と対応範囲",
        "同意ベースの紹介依頼ルート",
        "確認担当者の連絡先は非公開",
      ],
      stepsTitle: "より安全な検討フロー",
      steps: [
        "検証済みAI案件プロフィールを見る。",
        "承認された範囲、成果、企業文脈を確認する。",
        "必要な場合だけJISSEKI経由で紹介依頼を送る。",
        "本人と確認担当者が同意した場合だけ次へ進む。",
      ],
      trustTitle: "外注先選定リスクを下げる理由",
      trustBody:
        "質の高いAI納品を見つけやすくしつつ、確認担当者のコントロールを守る設計です。",
      trustPoints: [
        "説得力より証拠に基づいて候補者を絞れる",
        "紹介依頼が構造化され、同意ベースで進む",
        "AI導入を検討する事業会社、スタートアップ、部門に向く",
      ],
      finalTitle: "より明確な信用シグナルでAI外注を始める。",
      finalBody:
        "βでは、一般公開の即時決済ではなく、既知のデザインパートナーと小さな検討導線から始めます。",
    },
  },
};

export function AudienceLanding({
  audience,
  locale,
}: {
  audience: AudienceKind;
  locale: Locale;
}) {
  const copy = audienceCopy[audience][locale];
  const betaIntent = audience === "developers" ? "developer" : "company";
  const currentPath = audience === "developers" ? "/developers" : "/companies";

  return (
    <main lang={locale} className="min-h-dvh bg-[#f5f2ec] text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href={localizedHref("/", locale)} className="text-sm font-semibold">
            JISSEKI
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} path={currentPath} />
            <Link
              href={localizedHref(`/beta-access?intent=${betaIntent}`, locale)}
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.primaryCta}
            </Link>
          </div>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
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
                href={localizedHref(`/beta-access?intent=${betaIntent}`, locale)}
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

          <aside className="rounded-[2rem] border border-zinc-300 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-zinc-500">{copy.proofTitle}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
              {copy.proofBody}
            </h2>
            <ul className="mt-6 space-y-3">
              {copy.proofPoints.map((point) => (
                <li
                  key={point}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
                >
                  <span className="mr-2 font-semibold text-zinc-950">✓</span>
                  {point}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-zinc-950 p-6 text-white md:p-8">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {copy.stepsTitle}
            </h2>
            <ol className="mt-6 space-y-3">
              {copy.steps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    Step {index + 1}
                  </span>
                  <p className="mt-2 text-sm leading-6 text-zinc-200 text-pretty">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[2rem] border border-zinc-300 bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              {copy.trustTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-700 text-pretty">
              {copy.trustBody}
            </p>
            <div className="mt-6 grid gap-3">
              {copy.trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-700"
                >
                  {point}
                </div>
              ))}
            </div>
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
              href={localizedHref(`/beta-access?intent=${betaIntent}`, locale)}
              className="inline-flex justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={localizedHref("/ai-solutions", locale)}
              className="inline-flex justify-center rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {locale === "ja" ? "総合ページへ戻る" : "Back to overview"}
            </Link>
          </div>
        </section>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}
