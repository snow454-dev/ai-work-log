import Link from "next/link";

import {
  acceptReferenceRequest,
  declineReferenceRequest,
} from "@/app/actions/reference-request-decisions";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getCurrentUserId } from "@/data/auth";
import { listProjectsForUser, type ProjectListItem } from "@/data/projects";
import { getProfileForUser } from "@/data/profiles";
import {
  listReferenceRequestsForOwner,
  type ReferenceRequestListItem,
} from "@/data/reference-requests";
import type { ProjectStatus } from "@/domain/project-status";
import { localizedHref, type Locale, type LocaleSearchParams } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";

const statusLabels: Record<Locale, Record<ProjectStatus, string>> = {
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

const requestStatusLabels: Record<
  Locale,
  Record<ReferenceRequestListItem["status"], string>
> = {
  en: {
    pending: "pending",
    accepted: "accepted",
    declined: "declined",
    expired: "expired",
  },
  ja: {
    pending: "未対応",
    accepted: "承認済み",
    declined: "辞退済み",
    expired: "期限切れ",
  },
};

const dashboardCopy: Record<
  Locale,
  {
    workspace: string;
    title: string;
    intro: string;
    viewProfile: string;
    addProject: string;
    projectsMetric: string;
    pendingMetric: string;
    verifiedMetric: string;
    requestsTitle: string;
    requestsIntro: string;
    noRequests: string;
    completeProfileTitle: string;
    completeProfileBody: string;
    setupProfile: string;
    projectsTitle: string;
    projectsIntro: string;
    emptyTitle: string;
    emptyBody: string;
    accept: string;
    decline: string;
  }
> = {
  en: {
    workspace: "MVP workspace",
    title: "Build verified proof from completed client work",
    intro:
      "Add a completed project, request company verification, then share only the evidence the company approved.",
    viewProfile: "View public profile",
    addProject: "Add completed project",
    projectsMetric: "Projects",
    pendingMetric: "Pending company review",
    verifiedMetric: "Verified proof",
    requestsTitle: "Reference requests",
    requestsIntro:
      "Requests from prospects who found a reference path on your public proof.",
    noRequests:
      "No reference requests yet. When a prospect submits one, it will appear here before any company reviewer is contacted.",
    completeProfileTitle: "Complete your profile first",
    completeProfileBody:
      "Companies are more likely to approve a verification request when the professional identity is clear.",
    setupProfile: "Set up profile",
    projectsTitle: "Projects",
    projectsIntro: "One card per completed engagement.",
    emptyTitle: "No projects yet",
    emptyBody:
      "Start with one completed engagement. The first draft only records facts; verification and public sharing come after.",
    accept: "Accept",
    decline: "Decline",
  },
  ja: {
    workspace: "MVPワークスペース",
    title: "完了した顧客案件から検証済み実績を作る",
    intro:
      "完了した案件を追加し、企業確認を依頼し、企業が承認した証拠だけを公開できます。",
    viewProfile: "公開プロフィールを見る",
    addProject: "完了案件を追加",
    projectsMetric: "案件",
    pendingMetric: "企業確認待ち",
    verifiedMetric: "検証済み実績",
    requestsTitle: "紹介依頼",
    requestsIntro:
      "公開実績の紹介依頼ルートから届いた見込み顧客の依頼です。",
    noRequests:
      "紹介依頼はまだありません。見込み顧客が送信すると、企業確認担当者へ連絡する前にここへ表示されます。",
    completeProfileTitle: "まずプロフィールを完成させましょう",
    completeProfileBody:
      "本人情報が明確なほど、企業は確認依頼を承認しやすくなります。",
    setupProfile: "プロフィールを設定",
    projectsTitle: "案件",
    projectsIntro: "完了した案件ごとに1枚のカードを作ります。",
    emptyTitle: "案件はまだありません",
    emptyBody:
      "まず1件の完了済み案件から始めましょう。最初の下書きでは事実だけを記録し、確認と公開はその後に行います。",
    accept: "承認",
    decline: "辞退",
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = await resolveServerLocale(await searchParams);
  const copy = dashboardCopy[locale];
  const userId = await getCurrentUserId();
  const [profile, projects, referenceRequests] = await Promise.all([
    getProfileForUser(userId),
    listProjectsForUser(userId),
    listReferenceRequestsForOwner(),
  ]);

  const verifiedCount = projects.filter((project) =>
    ["verified", "published"].includes(project.status),
  ).length;
  const pendingCount = projects.filter((project) =>
    ["sent", "viewed"].includes(project.status),
  ).length;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-zinc-500">
                {copy.workspace}
              </p>
              <LanguageSwitcher locale={locale} path="/dashboard" />
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950 text-balance">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-600 text-pretty">
              {copy.intro}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {profile?.isPublic ? (
              <Link
                href={localizedHref(`/p/${profile.slug}`, locale)}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                {copy.viewProfile}
              </Link>
            ) : null}
            <Link
              href={localizedHref("/projects/new", locale)}
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              {copy.addProject}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label={copy.projectsMetric} value={projects.length} />
        <MetricCard label={copy.pendingMetric} value={pendingCount} />
        <MetricCard label={copy.verifiedMetric} value={verifiedCount} />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              {copy.requestsTitle}
            </h2>
            <p className="text-sm text-zinc-500">
              {copy.requestsIntro}
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 tabular-nums">
            {referenceRequests.length}
          </span>
        </div>
        {referenceRequests.length === 0 ? (
          <div className="px-6 py-8">
            <p className="text-sm text-zinc-500 text-pretty">
              {copy.noRequests}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {referenceRequests.map((request) => (
              <ReferenceRequestRow
                key={request.id}
                request={request}
                locale={locale}
                copy={copy}
              />
            ))}
          </ul>
        )}
      </section>

      {!profile ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">
            {copy.completeProfileTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-amber-900">
            {copy.completeProfileBody}
          </p>
          <Link
            href={localizedHref("/onboarding", locale)}
            className="mt-4 inline-flex rounded-full bg-amber-950 px-4 py-2 text-sm font-medium text-white"
          >
            {copy.setupProfile}
          </Link>
        </section>
      ) : null}

      <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              {copy.projectsTitle}
            </h2>
            <p className="text-sm text-zinc-500">
              {copy.projectsIntro}
            </p>
          </div>
        </div>
        {projects.length === 0 ? (
          <EmptyProjects locale={locale} copy={copy} />
        ) : (
          <ul className="divide-y divide-zinc-200">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} locale={locale} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-950 tabular-nums">
        {value}
      </p>
    </div>
  );
}

function EmptyProjects({
  locale,
  copy,
}: {
  locale: Locale;
  copy: (typeof dashboardCopy)[Locale];
}) {
  return (
    <div className="px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-zinc-950">
        {copy.emptyTitle}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 text-pretty">
        {copy.emptyBody}
      </p>
      <Link
        href={localizedHref("/projects/new", locale)}
        className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white"
      >
        {copy.addProject}
      </Link>
    </div>
  );
}

function ReferenceRequestRow({
  request,
  locale,
  copy,
}: {
  request: ReferenceRequestListItem;
  locale: Locale;
  copy: (typeof dashboardCopy)[Locale];
}) {
  return (
    <li className="px-6 py-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-950">
            {request.requesterName} · {request.requesterCompany}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {request.publicTitle}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-700 text-pretty">
            {request.opportunityContext}
          </p>
          {request.message ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 text-pretty">
              {request.message}
            </p>
          ) : null}
        </div>
        <div className="text-left md:text-right">
          <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium capitalize text-zinc-700">
            {requestStatusLabels[locale][request.status]}
          </span>
          <p className="mt-2 text-sm text-zinc-500">
            {request.requesterEmail}
          </p>
          {request.requesterRole ? (
            <p className="mt-1 text-sm text-zinc-500">
              {request.requesterRole}
            </p>
          ) : null}
          {request.status === "pending" ? (
            <div className="mt-4 flex flex-col gap-2 sm:flex-row md:justify-end">
              <form action={acceptReferenceRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="w-full rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 sm:w-auto"
                >
                  {copy.accept}
                </button>
              </form>
              <form action={declineReferenceRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 sm:w-auto"
                >
                  {copy.decline}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ProjectRow({
  project,
  locale,
}: {
  project: ProjectListItem;
  locale: Locale;
}) {
  return (
    <li>
      <Link
        href={localizedHref(`/projects/${project.id}`, locale)}
        className="block px-6 py-5 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-950"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-medium text-zinc-950">{project.title}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {project.companyName} · {project.serviceCategory}
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
            {statusLabels[locale][project.status]}
          </span>
        </div>
      </Link>
    </li>
  );
}
