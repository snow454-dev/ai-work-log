import Link from "next/link";

import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  getVerificationReceiptByToken,
  type VerificationReceipt,
} from "@/data/verification-receipts";
import {
  localizedHref,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";
import { hashOpaqueToken } from "@/lib/security/tokens";

type ReceiptSearchParams = LocaleSearchParams & {
  token?: string | string[];
};

const receiptCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    unavailableTitle: string;
    unavailableBody: string;
    back: string;
    receipt: string;
    project: string;
    company: string;
    service: string;
    reviewer: string;
    submitted: string;
    status: string;
    sharing: string;
    reference: string;
    activeConsent: string;
    withdrawnConsent: string;
    disputedConsent: string;
    verified: string;
    declined: string;
    sharePublic: string;
    referenceOnly: string;
    notNow: string;
    referenceAvailable: string;
    referenceUnavailable: string;
    changeTitle: string;
    changeBody: string;
    changeNote: string;
  }
> = {
  en: {
    eyebrow: "Verification receipt",
    title: "Your company verification was recorded",
    intro:
      "This private receipt confirms the choices submitted for the project. It does not expose your email or private project details publicly.",
    unavailableTitle: "Receipt unavailable",
    unavailableBody:
      "This receipt link may be invalid, expired, or incomplete. For beta support, contact the professional who sent the verification request.",
    back: "Back to JISSEKI",
    receipt: "Receipt",
    project: "Project",
    company: "Company",
    service: "Service",
    reviewer: "Reviewer",
    submitted: "Submitted",
    status: "Current status",
    sharing: "Sharing preference",
    reference: "Future reference requests",
    activeConsent: "Active consent",
    withdrawnConsent: "Withdrawn",
    disputedConsent: "Disputed",
    verified: "Facts verified",
    declined: "Facts not fully verified",
    sharePublic: "Approved fields may appear publicly",
    referenceOnly: "Reference requests only; not public proof",
    notNow: "Not shareable now",
    referenceAvailable: "Allowed through JISSEKI",
    referenceUnavailable: "Not enabled",
    changeTitle: "Need to change this later?",
    changeBody:
      "During private beta, consent changes and disputes are handled manually so we can verify the requester and preserve the audit trail.",
    changeNote:
      "Reply through your existing beta contact or ask the professional to contact JISSEKI support with this receipt ID.",
  },
  ja: {
    eyebrow: "確認控え",
    title: "企業確認の内容を記録しました",
    intro:
      "この非公開の控えは、案件に対して送信された選択内容を確認するためのものです。あなたのメールアドレスや非公開の案件詳細は公開されません。",
    unavailableTitle: "確認控えを利用できません",
    unavailableBody:
      "この控えリンクは無効、期限切れ、または不完全な可能性があります。β期間中のサポートは、確認依頼を送ったプロフェッショナルへ連絡してください。",
    back: "JISSEKIへ戻る",
    receipt: "控え",
    project: "案件",
    company: "企業",
    service: "サービス",
    reviewer: "確認者",
    submitted: "送信日時",
    status: "現在の状態",
    sharing: "共有設定",
    reference: "将来の紹介依頼",
    activeConsent: "同意は有効",
    withdrawnConsent: "取り下げ済み",
    disputedConsent: "異議あり",
    verified: "事実確認済み",
    declined: "事実を完全には確認できませんでした",
    sharePublic: "承認済み項目を公開表示してよい",
    referenceOnly: "紹介依頼のみ可。公開実績としては掲載しない",
    notNow: "現時点では共有不可",
    referenceAvailable: "JISSEKI経由で許可",
    referenceUnavailable: "未許可",
    changeTitle: "後から変更が必要ですか？",
    changeBody:
      "非公開βでは、同意変更や異議申立てを手動で扱い、依頼者確認と監査履歴を保護します。",
    changeNote:
      "既存のβ連絡経路で返信するか、この控えIDを添えてプロフェッショナルからJISSEKIサポートへ連絡してもらってください。",
  },
};

function tokenFromQuery(query: ReceiptSearchParams): string | undefined {
  return Array.isArray(query.token) ? query.token[0] : query.token;
}

function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(local.length - 2, 2))}@${domain}`;
}

function consentLabel(receipt: VerificationReceipt, locale: Locale): string {
  const copy = receiptCopy[locale];

  if (receipt.consentStatus === "withdrawn") {
    return copy.withdrawnConsent;
  }

  if (receipt.consentStatus === "disputed") {
    return copy.disputedConsent;
  }

  return receipt.companyDomainVerified ? copy.verified : copy.declined;
}

function sharingLabel(
  preference: VerificationReceipt["sharingPreference"],
  locale: Locale,
): string {
  const copy = receiptCopy[locale];

  if (preference === "share_public_profile") {
    return copy.sharePublic;
  }

  if (preference === "open_to_reference_request") {
    return copy.referenceOnly;
  }

  return copy.notNow;
}

export default async function VerificationReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ verificationId: string }>;
  searchParams: Promise<ReceiptSearchParams>;
}) {
  const [{ verificationId }, query] = await Promise.all([params, searchParams]);
  const locale = await resolveServerLocale(query);
  const copy = receiptCopy[locale];
  const token = tokenFromQuery(query);

  if (!token) {
    return <Unavailable locale={locale} />;
  }

  let receipt: VerificationReceipt | null = null;

  try {
    receipt = await getVerificationReceiptByToken({
      verificationId,
      receiptTokenHash: hashOpaqueToken(token),
    });
  } catch {
    receipt = null;
  }

  if (!receipt) {
    return <Unavailable locale={locale} />;
  }

  const languagePath = `/verification-receipt/${verificationId}?token=${encodeURIComponent(
    token,
  )}`;

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href={localizedHref("/", locale)} className="text-sm font-semibold">
            JISSEKI
          </Link>
          <LanguageSwitcher locale={locale} path={languagePath} />
        </header>

        <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-zinc-500">{copy.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-950 text-balance">
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 text-pretty">
            {copy.intro}
          </p>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <ReceiptItem label={copy.receipt} value={receipt.id} mono />
            <ReceiptItem label={copy.status} value={consentLabel(receipt, locale)} />
            <ReceiptItem label={copy.project} value={receipt.projectTitle} />
            <ReceiptItem label={copy.company} value={receipt.companyName} />
            <ReceiptItem label={copy.service} value={receipt.serviceCategory} />
            <ReceiptItem
              label={copy.reviewer}
              value={maskEmail(receipt.reviewerEmail)}
            />
            <ReceiptItem
              label={copy.submitted}
              value={new Date(receipt.submittedAt).toISOString()}
            />
            <ReceiptItem
              label={copy.sharing}
              value={sharingLabel(receipt.sharingPreference, locale)}
            />
            <ReceiptItem
              label={copy.reference}
              value={
                receipt.openToReferenceRequests
                  ? copy.referenceAvailable
                  : copy.referenceUnavailable
              }
            />
            <ReceiptItem
              label={copy.activeConsent}
              value={
                receipt.consentStatus === "active"
                  ? copy.activeConsent
                  : consentLabel(receipt, locale)
              }
            />
          </dl>
        </section>

        <section className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">
            {copy.changeTitle}
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900 text-pretty">
            {copy.changeBody}
          </p>
          <p className="mt-2 text-sm leading-6 text-amber-900 text-pretty">
            {copy.changeNote}
          </p>
        </section>

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function ReceiptItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd
        className={`mt-2 break-words text-sm font-medium text-zinc-950 ${
          mono ? "font-mono" : "text-pretty"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Unavailable({ locale }: { locale: Locale }) {
  const copy = receiptCopy[locale];

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 px-5 py-10 text-zinc-950">
      <div className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-zinc-500">{copy.eyebrow}</p>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-950">
          {copy.unavailableTitle}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 text-pretty">
          {copy.unavailableBody}
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
