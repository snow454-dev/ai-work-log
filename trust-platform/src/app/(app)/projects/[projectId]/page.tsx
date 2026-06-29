import Link from "next/link";
import { notFound } from "next/navigation";

import { publishProjectEvidence } from "@/app/actions/publication";
import { sendVerificationRequestForm } from "@/app/actions/verification-requests";
import { getCurrentUserId } from "@/data/auth";
import { getProjectForUser } from "@/data/projects";
import { getProfileForUser } from "@/data/profiles";
import type { ProjectStatus } from "@/domain/project-status";
import { localizedHref, type Locale, type LocaleSearchParams } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";

const acquisitionLabels: Record<Locale, Record<string, string>> = {
  en: {
    upwork: "Upwork",
    sankaku: "サンカク",
    other_platform: "Other platform",
    referral: "Referral",
    direct: "Direct",
    other: "Other",
  },
  ja: {
    upwork: "Upwork",
    sankaku: "サンカク",
    other_platform: "その他のプラットフォーム",
    referral: "紹介",
    direct: "直接契約",
    other: "その他",
  },
};

const projectStatusLabels: Record<Locale, Record<ProjectStatus, string>> = {
  en: {
    draft: "Draft",
    sent: "Sent",
    viewed: "Viewed",
    verified: "Verified",
    published: "Published",
    withdrawn: "Withdrawn",
    expired: "Expired",
    declined: "Declined",
    disputed: "Disputed",
  },
  ja: {
    draft: "下書き",
    sent: "送信済み",
    viewed: "閲覧済み",
    verified: "検証済み",
    published: "公開済み",
    withdrawn: "取り下げ",
    expired: "期限切れ",
    declined: "辞退",
    disputed: "要確認",
  },
};

const projectDetailCopy: Record<
  Locale,
  {
    back: string;
    publishFailed: string;
    service: string;
    source: string;
    reviewer: string;
    period: string;
    notProvided: string;
    currentRevision: string;
    companyDomain: string;
    companyWebsite: string;
    role: string;
    outcome: string;
    metric: string;
    contentHash: string;
    companyVerification: string;
    companyVerificationDescription: string;
    readyToSend: string;
    alreadySent: string;
    sendVerification: string;
    publicationControls: string;
    publicationDescription: string;
    published: string;
    readyIfAllowed: string;
    lockedUntilVerified: string;
    viewPublicProfile: string;
    publishVerified: string;
    createProfileFirst: string;
    unknown: string;
    present: string;
  }
> = {
  en: {
    back: "← Back to dashboard",
    publishFailed:
      "This proof cannot be published yet. Confirm the project is verified, your profile exists, and the company allowed public profile sharing.",
    service: "Service",
    source: "Source",
    reviewer: "Reviewer",
    period: "Period",
    notProvided: "Not provided",
    currentRevision: "Current immutable revision",
    companyDomain: "Company domain",
    companyWebsite: "Company website",
    role: "Your role",
    outcome: "Outcome",
    metric: "Metric",
    contentHash: "Content hash",
    companyVerification: "Company verification",
    companyVerificationDescription:
      "Next step: send a secure review link to a company-domain email. The reviewer can approve, correct, decline, or limit what becomes public.",
    readyToSend: "Ready to send",
    alreadySent: "Already sent",
    sendVerification: "Send verification request",
    publicationControls: "Publication controls",
    publicationDescription:
      "Publish a public proof card only after company verification and only with fields the company allowed.",
    published: "Published",
    readyIfAllowed: "Ready if company allowed sharing",
    lockedUntilVerified: "Locked until verified",
    viewPublicProfile: "View public profile",
    publishVerified: "Publish verified proof",
    createProfileFirst: "Create profile first",
    unknown: "Unknown",
    present: "Present",
  },
  ja: {
    back: "← ダッシュボードへ戻る",
    publishFailed:
      "この実績はまだ公開できません。案件が検証済みであること、プロフィールが存在すること、企業が公開共有を許可していることを確認してください。",
    service: "サービス",
    source: "経路",
    reviewer: "確認担当者",
    period: "期間",
    notProvided: "未入力",
    currentRevision: "現在の改ざん不可リビジョン",
    companyDomain: "企業ドメイン",
    companyWebsite: "企業サイト",
    role: "あなたの役割",
    outcome: "成果",
    metric: "指標",
    contentHash: "コンテンツハッシュ",
    companyVerification: "企業確認",
    companyVerificationDescription:
      "次のステップ: 企業ドメインのメールアドレスへ安全な確認リンクを送ります。確認担当者は承認・修正・辞退、または公開範囲の制限を選べます。",
    readyToSend: "送信可能",
    alreadySent: "送信済み",
    sendVerification: "確認依頼を送信",
    publicationControls: "公開設定",
    publicationDescription:
      "企業確認後、企業が許可した項目だけを公開実績カードとして掲載できます。",
    published: "公開済み",
    readyIfAllowed: "企業が共有を許可していれば公開可能",
    lockedUntilVerified: "検証完了までロック中",
    viewPublicProfile: "公開プロフィールを見る",
    publishVerified: "検証済み実績を公開",
    createProfileFirst: "先にプロフィールを作成",
    unknown: "不明",
    present: "現在",
  },
};

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<LocaleSearchParams & { publish?: string | string[] }>;
}) {
  const [{ projectId }, query, userId] = await Promise.all([
    params,
    searchParams,
    getCurrentUserId(),
  ]);
  const locale = await resolveServerLocale(query);
  const copy = projectDetailCopy[locale];
  const [project, profile] = await Promise.all([
    getProjectForUser({ projectId, userId }),
    getProfileForUser(userId),
  ]);

  if (!project) {
    notFound();
  }

  const sourceLabel =
    project.acquisitionSource === "other_platform" &&
    project.sourcePlatformLabel
      ? project.sourcePlatformLabel
      : acquisitionLabels[locale][project.acquisitionSource];
  const publishStatus = Array.isArray(query.publish)
    ? query.publish[0]
    : query.publish;
  const publicProfileHref = profile?.isPublic
    ? localizedHref(`/p/${profile.slug}`, locale)
    : null;
  const canPublish =
    project.status === "verified" || project.status === "published";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link
          href={localizedHref("/dashboard", locale)}
          className="text-sm font-medium text-zinc-500"
        >
          {copy.back}
        </Link>
        <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                {project.companyName}
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-950 text-balance">
                {project.title}
              </h1>
              <p className="mt-3 max-w-2xl text-zinc-600 text-pretty">
                {project.summary}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium capitalize text-zinc-700">
              {projectStatusLabels[locale][project.status]}
            </span>
          </div>
        </div>
      </div>

      {publishStatus === "failed" ? (
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
        >
          {copy.publishFailed}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard label={copy.service} value={project.serviceCategory} />
        <InfoCard label={copy.source} value={sourceLabel} />
        <InfoCard
          label={copy.reviewer}
          value={project.reviewerEmail ?? copy.notProvided}
        />
        <InfoCard
          label={copy.period}
          value={formatPeriod(project.projectStart, project.projectEnd, copy)}
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-950">
          {copy.currentRevision}
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextBlock label={copy.companyDomain} value={project.companyDomain} />
          <TextBlock
            label={copy.companyWebsite}
            value={project.companyWebsite ?? copy.notProvided}
          />
          <TextBlock label={copy.role} value={project.roleDescription} />
          <TextBlock label={copy.outcome} value={project.outcomeStatement} />
          <TextBlock
            label={copy.metric}
            value={
              project.outcomeMetricValue !== null && project.outcomeMetricUnit
                ? `${project.outcomeMetricValue} ${project.outcomeMetricUnit}`
                : copy.notProvided
            }
          />
          <TextBlock
            label={copy.contentHash}
            value={project.contentHash}
            monospace
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title={copy.companyVerification}
          description={copy.companyVerificationDescription}
          status={
            project.status === "draft" || project.status === "expired"
              ? copy.readyToSend
              : copy.alreadySent
          }
          action={
            project.status === "draft" || project.status === "expired" ? (
              <form action={sendVerificationRequestForm.bind(null, project.id)}>
                <button
                  type="submit"
                  className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                >
                  {copy.sendVerification}
                </button>
              </form>
            ) : null
          }
        />
        <ActionCard
          title={copy.publicationControls}
          description={copy.publicationDescription}
          status={
            project.status === "published"
              ? copy.published
              : canPublish
                ? copy.readyIfAllowed
                : copy.lockedUntilVerified
          }
          action={
            project.status === "published" && publicProfileHref ? (
              <Link
                href={publicProfileHref}
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                {copy.viewPublicProfile}
              </Link>
            ) : canPublish && profile ? (
              <form action={publishProjectEvidence.bind(null, project.id)}>
                <button
                  type="submit"
                  className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                >
                  {copy.publishVerified}
                </button>
              </form>
            ) : canPublish ? (
              <Link
                href={localizedHref("/onboarding", locale)}
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                {copy.createProfileFirst}
              </Link>
            ) : null
          }
        />
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 font-medium text-zinc-950 text-pretty">{value}</p>
    </div>
  );
}

function TextBlock({
  label,
  value,
  monospace,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-500">{label}</h3>
      <p
        className={`mt-1 break-words text-sm text-zinc-900 ${
          monospace ? "font-mono" : "text-pretty"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  status,
  action,
}: {
  title: string;
  description: string;
  status: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase text-zinc-500">{status}</p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600 text-pretty">{description}</p>
      {action}
    </div>
  );
}

function formatPeriod(
  start: string | null,
  end: string | null,
  copy: (typeof projectDetailCopy)[Locale],
): string {
  if (!start && !end) {
    return copy.notProvided;
  }

  return `${start ?? copy.unknown} → ${end ?? copy.present}`;
}
