import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ReviewerOtpForm } from "@/components/reviewer-otp-form";
import {
  openReviewerInvitation,
  type ReviewerInvitation,
} from "@/data/reviewer-auth";
import { env } from "@/lib/env";
import { localizedHref, type Locale, type LocaleSearchParams } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";
import { hashOpaqueToken } from "@/lib/security/tokens";

const invitationCopy: Record<
  Locale,
  {
    eyebrow: string;
    titlePrefix: string;
    introBeforeName: string;
    introAfterName: string;
    introCode: string;
    expires: string;
    invalidTitle: string;
    invalidBody: string;
    back: string;
  }
> = {
  en: {
    eyebrow: "Company verification",
    titlePrefix: "Review the evidence for",
    introBeforeName: "",
    introAfterName: " asked you to verify a completed project.",
    introCode:
      "To protect your company and the professional, we will first send a one-time code to",
    expires: "This invitation expires at",
    invalidTitle: "This verification link is unavailable",
    invalidBody:
      "The link may be expired, revoked, or already used. Ask the professional to send a fresh verification request.",
    back: "Back to JISSEKI",
  },
  ja: {
    eyebrow: "企業確認",
    titlePrefix: "実績内容の確認:",
    introBeforeName: "",
    introAfterName: "さんから、完了案件の事実確認依頼が届いています。",
    introCode:
      "企業とプロフェッショナル双方を保護するため、まず次のメールアドレスへワンタイムコードを送信します:",
    expires: "この招待リンクの有効期限:",
    invalidTitle: "この確認リンクは利用できません",
    invalidBody:
      "リンクが期限切れ、取り消し済み、またはすでに使用済みの可能性があります。プロフェッショナルに新しい確認依頼を送ってもらってください。",
    back: "JISSEKIへ戻る",
  },
};

export default async function VerifyInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<LocaleSearchParams & { token?: string | string[] }>;
}) {
  const [{ requestId }, query] = await Promise.all([params, searchParams]);
  const locale = await resolveServerLocale(query);
  const copy = invitationCopy[locale];
  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  if (!token) {
    return <InvalidInvitation locale={locale} />;
  }

  let invitation: ReviewerInvitation;

  try {
    invitation = await openReviewerInvitation({
      requestId,
      invitationTokenHash: hashOpaqueToken(token),
    });
  } catch {
    return <InvalidInvitation locale={locale} />;
  }

  const languagePath = `/verify/${requestId}?token=${encodeURIComponent(token)}`;
  const manualMode = env.MAIL_TRANSPORT === "manual";

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-500">
            {copy.eyebrow}
          </p>
          <LanguageSwitcher locale={locale} path={languagePath} />
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950 text-balance">
          {copy.titlePrefix} {invitation.projectTitle}
        </h1>
        <p className="mt-3 text-zinc-600 text-pretty">
          {copy.introBeforeName}
          {invitation.professionalName}
          {copy.introAfterName} {copy.introCode}{" "}
          {maskEmail(invitation.reviewerEmail)}.
        </p>
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-600">
          <p>
            {copy.expires}{" "}
            <span className="font-medium text-zinc-950">
              {new Date(invitation.expiresAt).toISOString()}
            </span>
            .
          </p>
        </div>
        <div className="mt-6">
          <ReviewerOtpForm
            invitation={invitation}
            token={token}
            locale={locale}
            manualMode={manualMode}
          />
        </div>
      </div>
    </main>
  );
}

function InvalidInvitation({ locale }: { locale: Locale }) {
  const copy = invitationCopy[locale];

  return (
    <main className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">
          {copy.invalidTitle}
        </h1>
        <p className="mt-3 text-sm text-zinc-600 text-pretty">
          {copy.invalidBody}
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

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}
