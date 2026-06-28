import Link from "next/link";
import { notFound } from "next/navigation";

import { publishProjectEvidence } from "@/app/actions/publication";
import { sendVerificationRequestForm } from "@/app/actions/verification-requests";
import { getCurrentUserId } from "@/data/auth";
import { getProjectForUser } from "@/data/projects";
import { getProfileForUser } from "@/data/profiles";

const acquisitionLabels = {
  upwork: "Upwork",
  sankaku: "サンカク",
  other_platform: "Other platform",
  referral: "Referral",
  direct: "Direct",
  other: "Other",
} as const;

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ publish?: string | string[] }>;
}) {
  const [{ projectId }, query, userId] = await Promise.all([
    params,
    searchParams,
    getCurrentUserId(),
  ]);
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
      : acquisitionLabels[project.acquisitionSource];
  const publishStatus = Array.isArray(query.publish)
    ? query.publish[0]
    : query.publish;
  const publicProfileHref = profile?.isPublic ? `/p/${profile.slug}` : null;
  const canPublish =
    project.status === "verified" || project.status === "published";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <Link href="/dashboard" className="text-sm font-medium text-zinc-500">
          ← Back to dashboard
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
              {project.status}
            </span>
          </div>
        </div>
      </div>

      {publishStatus === "failed" ? (
        <div
          role="alert"
          className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950"
        >
          This proof cannot be published yet. Confirm the project is verified,
          your profile exists, and the company allowed public profile sharing.
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Service" value={project.serviceCategory} />
        <InfoCard label="Source" value={sourceLabel} />
        <InfoCard
          label="Reviewer"
          value={project.reviewerEmail ?? "Not provided"}
        />
        <InfoCard
          label="Period"
          value={formatPeriod(project.projectStart, project.projectEnd)}
        />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-zinc-950">
          Current immutable revision
        </h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <TextBlock label="Company domain" value={project.companyDomain} />
          <TextBlock
            label="Company website"
            value={project.companyWebsite ?? "Not provided"}
          />
          <TextBlock label="Your role" value={project.roleDescription} />
          <TextBlock label="Outcome" value={project.outcomeStatement} />
          <TextBlock
            label="Metric"
            value={
              project.outcomeMetricValue !== null && project.outcomeMetricUnit
                ? `${project.outcomeMetricValue} ${project.outcomeMetricUnit}`
                : "Not provided"
            }
          />
          <TextBlock
            label="Content hash"
            value={project.contentHash}
            monospace
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <ActionCard
          title="Company verification"
          description="Next step: send a secure review link to a company-domain email. The reviewer can approve, correct, decline, or limit what becomes public."
          status={
            project.status === "draft" || project.status === "expired"
              ? "Ready to send"
              : "Already sent"
          }
          action={
            project.status === "draft" || project.status === "expired" ? (
              <form action={sendVerificationRequestForm.bind(null, project.id)}>
                <button
                  type="submit"
                  className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                >
                  Send verification request
                </button>
              </form>
            ) : null
          }
        />
        <ActionCard
          title="Publication controls"
          description="Publish a public proof card only after company verification and only with fields the company allowed."
          status={
            project.status === "published"
              ? "Published"
              : canPublish
                ? "Ready if company allowed sharing"
                : "Locked until verified"
          }
          action={
            project.status === "published" && publicProfileHref ? (
              <Link
                href={publicProfileHref}
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                View public profile
              </Link>
            ) : canPublish && profile ? (
              <form action={publishProjectEvidence.bind(null, project.id)}>
                <button
                  type="submit"
                  className="mt-4 rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
                >
                  Publish verified proof
                </button>
              </form>
            ) : canPublish ? (
              <Link
                href="/onboarding"
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                Create profile first
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

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "Not provided";
  }

  return `${start ?? "Unknown"} → ${end ?? "Present"}`;
}
