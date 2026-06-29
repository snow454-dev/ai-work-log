import { cookies } from "next/headers";
import Link from "next/link";

import { PublicEvidencePreview } from "@/components/public-evidence-preview";
import { VerificationReviewForm } from "@/components/verification-review-form";
import { reviewerSessionCookieName } from "@/data/reviewer-auth";
import { getReviewerReviewContext } from "@/data/verifications";
import { localizedHref, type Locale, type LocaleSearchParams } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";
import { hashOpaqueToken } from "@/lib/security/tokens";

const reviewPageCopy: Record<
  Locale,
  {
    eyebrow: string;
    titlePrefix: string;
    intro: string;
    submittedTitle: string;
    submittedBodyPrefix: string;
    back: string;
    unavailableTitle: string;
    unavailableBody: string;
    statusLabels: Record<string, string>;
  }
> = {
  en: {
    eyebrow: "Company verification",
    titlePrefix: "Verify",
    intro:
      "Confirm the facts, choose any public fields, and submit. This is not a positive-review prompt; it is a factual company verification.",
    submittedTitle: "Verification submitted",
    submittedBodyPrefix: "Thank you. The project is now marked as",
    back: "Back to Proofboard",
    unavailableTitle: "Review session unavailable",
    unavailableBody:
      "Your session may have expired. Reopen the verification link and request a fresh one-time code.",
    statusLabels: {},
  },
  ja: {
    eyebrow: "企業確認",
    titlePrefix: "確認対象",
    intro:
      "事実を確認し、公開してよい項目を選んで送信してください。これは好意的レビューの依頼ではなく、事実ベースの企業確認です。",
    submittedTitle: "確認結果を送信しました",
    submittedBodyPrefix: "ありがとうございます。この案件の状態は次のように更新されました:",
    back: "Proofboardへ戻る",
    unavailableTitle: "レビューセッションを利用できません",
    unavailableBody:
      "セッションの有効期限が切れた可能性があります。確認リンクを開き直し、新しいワンタイムコードを依頼してください。",
    statusLabels: {
      verified: "検証済み",
      declined: "辞退",
      disputed: "要確認",
    },
  },
};

export default async function ReviewerReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<LocaleSearchParams & { submitted?: string | string[] }>;
}) {
  const [{ requestId }, query] = await Promise.all([params, searchParams]);
  const locale = await resolveServerLocale(query);
  const copy = reviewPageCopy[locale];
  const submitted = Array.isArray(query.submitted)
    ? query.submitted[0]
    : query.submitted;

  if (submitted) {
    return <Submitted status={submitted} locale={locale} />;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(
    reviewerSessionCookieName(requestId),
  )?.value;

  if (!sessionToken) {
    return <Unavailable locale={locale} />;
  }

  const context = await getReviewerReviewContext({
    requestId,
    sessionHash: hashOpaqueToken(sessionToken),
  });

  if (!context) {
    return <Unavailable locale={locale} />;
  }

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            {copy.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-950 text-balance">
            {copy.titlePrefix} {context.projectTitle}
          </h1>
          <p className="mt-3 text-zinc-600 text-pretty">
            {copy.intro}
          </p>
          <div className="mt-8">
            <VerificationReviewForm context={context} locale={locale} />
          </div>
        </section>
        <PublicEvidencePreview context={context} locale={locale} />
      </div>
    </main>
  );
}

function Submitted({ status, locale }: { status: string; locale: Locale }) {
  const copy = reviewPageCopy[locale];
  const statusLabel = copy.statusLabels[status] ?? status;

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          {copy.submittedTitle}
        </h1>
        <p className="mt-3 text-sm text-zinc-600">
          {copy.submittedBodyPrefix} {statusLabel}.
        </p>
        <Link
          href={localizedHref("/", locale)}
          className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white"
        >
          {copy.back}
        </Link>
      </div>
    </main>
  );
}

function Unavailable({ locale }: { locale: Locale }) {
  const copy = reviewPageCopy[locale];

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          {copy.unavailableTitle}
        </h1>
        <p className="mt-3 text-sm text-zinc-600 text-pretty">
          {copy.unavailableBody}
        </p>
      </div>
    </main>
  );
}
