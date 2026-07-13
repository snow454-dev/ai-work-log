import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { AdminBetaAccessActions } from "@/components/admin-beta-access-actions";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  adminBetaAccessIntentSchema,
  adminBetaAccessStatusSchema,
  isCurrentUserAdmin,
  listAdminBetaAccessRequests,
  summarizeAdminBetaAccessRequests,
  type AdminBetaAccessIntent,
  type AdminBetaAccessRequestListItem,
  type AdminBetaAccessStatus,
} from "@/data/admin-beta-access";
import { getOptionalUserId } from "@/data/auth";
import { localizedHref, type Locale } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beta administration",
  robots: { index: false, follow: false },
};

type AdminSearchParams = {
  lang?: string | string[];
  status?: string | string[];
  intent?: string | string[];
};

const statusOrder: readonly AdminBetaAccessStatus[] = [
  "new",
  "reviewing",
  "invited",
  "declined",
  "closed",
];

const copyByLocale = {
  en: {
    operator: "Private beta operations",
    title: "Review requests. Grant access. Keep the queue moving.",
    intro:
      "Each invite grants database-backed access to one approved email. Direct table access remains blocked by row-level security.",
    dashboard: "Member dashboard",
    signOut: "Sign out",
    summary: "Application status",
    total: "Total",
    filters: "Filters",
    allStatuses: "All statuses",
    allIntents: "All applicants",
    developer: "AI developers",
    company: "Companies",
    requests: "Applications",
    shown: "shown",
    emptyTitle: "No applications match these filters",
    emptyBody: "Try another status or applicant type.",
    submitted: "Submitted",
    source: "Source",
    role: "Role",
    useCase: "What they want to do",
    email: "Work email",
    companyLabel: "Company",
    statusLabels: {
      new: "New",
      reviewing: "Reviewing",
      invited: "Invited",
      declined: "Declined",
      closed: "Closed",
    },
    intentLabels: {
      developer: "AI developer",
      company: "Company",
    },
  },
  ja: {
    operator: "プライベートβ 運用",
    title: "申請を確認し、承認した人へアクセスを付与する",
    intro:
      "招待すると、承認したメール1件にDB管理のアクセス権を付与します。申請テーブルへの直接アクセスはRLSで遮断されています。",
    dashboard: "会員ダッシュボード",
    signOut: "ログアウト",
    summary: "申請ステータス",
    total: "合計",
    filters: "絞り込み",
    allStatuses: "すべての状態",
    allIntents: "すべての申請者",
    developer: "AI開発者",
    company: "企業",
    requests: "βアクセス申請",
    shown: "件表示",
    emptyTitle: "条件に一致する申請はありません",
    emptyBody: "別のステータスまたは申請者種別を選んでください。",
    submitted: "申請日時",
    source: "流入元",
    role: "役割",
    useCase: "利用目的",
    email: "仕事用メール",
    companyLabel: "会社名",
    statusLabels: {
      new: "新着",
      reviewing: "審査中",
      invited: "招待済み",
      declined: "辞退",
      closed: "対応完了",
    },
    intentLabels: {
      developer: "AI開発者",
      company: "企業",
    },
  },
} as const;

function firstQueryValue(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function adminHref({
  locale,
  status,
  intent,
}: {
  locale: Locale;
  status?: AdminBetaAccessStatus;
  intent?: AdminBetaAccessIntent;
}): string {
  const params = new URLSearchParams();

  if (status) params.set("status", status);
  if (intent) params.set("intent", intent);
  if (locale === "ja") params.set("lang", "ja");

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

function languageSwitcherPath({
  status,
  intent,
}: {
  status?: AdminBetaAccessStatus;
  intent?: AdminBetaAccessIntent;
}): string {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (intent) params.set("intent", intent);
  return params.size > 0 ? `/admin?${params.toString()}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<AdminSearchParams>;
}) {
  const query = await searchParams;
  const locale = await resolveServerLocale(query);
  const copy = copyByLocale[locale];
  const rawStatus = firstQueryValue(query.status);
  const rawIntent = firstQueryValue(query.intent);
  const statusResult = adminBetaAccessStatusSchema.safeParse(rawStatus);
  const intentResult = adminBetaAccessIntentSchema.safeParse(rawIntent);
  const status = statusResult.success ? statusResult.data : undefined;
  const intent = intentResult.success ? intentResult.data : undefined;
  const adminPath = adminHref({ locale, status, intent });
  const userId = await getOptionalUserId();

  if (!userId) {
    const next = encodeURIComponent(adminPath);
    redirect(localizedHref(`/sign-in?next=${next}`, locale));
  }

  if (!(await isCurrentUserAdmin())) {
    notFound();
  }

  const [requests, summary] = await Promise.all([
    listAdminBetaAccessRequests({ status, intent }),
    summarizeAdminBetaAccessRequests(intent),
  ]);
  const total = Object.values(summary).reduce((sum, count) => sum + count, 0);

  return (
    <main className="min-h-dvh bg-[#f3efe5] text-stone-950">
      <header className="border-b border-stone-900/10 bg-stone-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-[0.18em]">JISSEKI</span>
            <span className="h-4 w-px bg-white/20" aria-hidden="true" />
            <span className="text-xs text-stone-400">ADMIN</span>
          </div>
          <nav className="flex items-center gap-3" aria-label="Admin navigation">
            <LanguageSwitcher
              locale={locale}
              path={languageSwitcherPath({ status, intent })}
              variant="dark"
            />
            <Link
              href={localizedHref("/dashboard", locale)}
              className="hidden text-sm text-stone-300 hover:text-white sm:inline"
            >
              {copy.dashboard}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-stone-400 hover:text-white"
              >
                {copy.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="grid gap-8 border-b border-stone-900/15 pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {copy.operator}
            </p>
            <h1 className="mt-3 max-w-4xl font-[family-name:var(--font-display)] text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
              {copy.title}
            </h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-stone-600 text-pretty">
            {copy.intro}
          </p>
        </section>

        <section className="mt-8" aria-labelledby="summary-title">
          <div className="flex items-end justify-between gap-4">
            <h2 id="summary-title" className="text-sm font-semibold">
              {copy.summary}
            </h2>
            <p className="text-xs text-stone-500">
              {copy.total} <span className="font-semibold tabular-nums text-stone-950">{total}</span>
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {statusOrder.map((item) => (
              <Link
                key={item}
                href={adminHref({ locale, status: item, intent })}
                aria-current={status === item ? "page" : undefined}
                className={`rounded-2xl border p-4 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
                  status === item
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-900/10 bg-white/70 hover:border-stone-900/30 hover:bg-white"
                }`}
              >
                <span className={`block text-xs ${status === item ? "text-stone-300" : "text-stone-500"}`}>
                  {copy.statusLabels[item]}
                </span>
                <span className="mt-2 block text-2xl font-semibold tabular-nums">
                  {summary[item]}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8" aria-labelledby="filter-title">
          <h2 id="filter-title" className="sr-only">{copy.filters}</h2>
          <div className="flex flex-wrap gap-2">
            <FilterLink
              active={!status}
              href={adminHref({ locale, intent })}
              label={copy.allStatuses}
            />
            <span className="mx-1 h-9 w-px bg-stone-900/15" aria-hidden="true" />
            <FilterLink
              active={!intent}
              href={adminHref({ locale, status })}
              label={copy.allIntents}
            />
            <FilterLink
              active={intent === "developer"}
              href={adminHref({ locale, status, intent: "developer" })}
              label={copy.developer}
            />
            <FilterLink
              active={intent === "company"}
              href={adminHref({ locale, status, intent: "company" })}
              label={copy.company}
            />
          </div>
        </section>

        <section className="mt-8" aria-labelledby="requests-title">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="requests-title" className="text-xl font-semibold">
              {copy.requests}
            </h2>
            <p className="text-xs text-stone-500">
              <span className="font-semibold tabular-nums text-stone-950">{requests.length}</span> {copy.shown}
            </p>
          </div>

          {requests.length === 0 ? (
            <div className="mt-4 rounded-3xl border border-dashed border-stone-900/20 bg-white/45 px-6 py-16 text-center">
              <h3 className="font-semibold">{copy.emptyTitle}</h3>
              <p className="mt-2 text-sm text-stone-500">{copy.emptyBody}</p>
            </div>
          ) : (
            <ol className="mt-4 grid gap-4 lg:grid-cols-2">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  locale={locale}
                  copy={copy}
                />
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-9 items-center rounded-full border px-3 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 ${
        active
          ? "border-stone-950 bg-stone-950 text-white"
          : "border-stone-900/15 bg-white/60 text-stone-600 hover:bg-white hover:text-stone-950"
      }`}
    >
      {label}
    </Link>
  );
}

function RequestCard({
  request,
  locale,
  copy,
}: {
  request: AdminBetaAccessRequestListItem;
  locale: Locale;
  copy: (typeof copyByLocale)[Locale];
}) {
  const date = new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(request.created_at));

  return (
    <li className="flex flex-col rounded-3xl border border-stone-900/10 bg-white p-5 shadow-[0_12px_30px_rgba(28,25,23,0.04)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-600">
              {copy.intentLabels[request.intent]}
            </span>
            <StatusBadge status={request.status} label={copy.statusLabels[request.status]} />
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight">
            {request.requester_name}
          </h3>
          <a
            href={`mailto:${request.work_email}`}
            className="mt-1 block break-all text-sm text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-stone-950"
          >
            {request.work_email}
          </a>
        </div>
        <span className="shrink-0 text-right text-[11px] leading-5 text-stone-400">
          {copy.submitted}
          <br />
          {date} UTC
        </span>
      </div>

      <dl className="mt-5 grid gap-3 border-y border-stone-200 py-4 text-sm sm:grid-cols-2">
        <Info label={copy.companyLabel} value={request.company_name} />
        <Info label={copy.role} value={request.role} />
        <Info label={copy.source} value={request.source_path} wide />
        <Info label={copy.email} value={request.work_email} wide />
      </dl>

      <div className="flex-1 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-400">
          {copy.useCase}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
          {request.use_case}
        </p>
      </div>

      <AdminBetaAccessActions
        requestId={request.id}
        status={request.status}
        locale={locale}
      />
    </li>
  );
}

function Info({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-stone-400">{label}</dt>
      <dd className="mt-0.5 break-words text-stone-700">{value ?? "—"}</dd>
    </div>
  );
}

function StatusBadge({
  status,
  label,
}: {
  status: AdminBetaAccessStatus;
  label: string;
}) {
  const styles: Record<AdminBetaAccessStatus, string> = {
    new: "bg-blue-50 text-blue-700 ring-blue-600/15",
    reviewing: "bg-amber-50 text-amber-800 ring-amber-600/20",
    invited: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    declined: "bg-red-50 text-red-700 ring-red-600/15",
    closed: "bg-stone-100 text-stone-500 ring-stone-500/15",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>
      {label}
    </span>
  );
}
