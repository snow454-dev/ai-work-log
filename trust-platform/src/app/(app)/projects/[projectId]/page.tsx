import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUserId } from "@/data/auth";
import { getProjectForUser } from "@/data/projects";

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
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [{ projectId }, userId] = await Promise.all([
    params,
    getCurrentUserId(),
  ]);
  const project = await getProjectForUser({ projectId, userId });

  if (!project) {
    notFound();
  }

  const sourceLabel =
    project.acquisitionSource === "other_platform" &&
    project.sourcePlatformLabel
      ? project.sourcePlatformLabel
      : acquisitionLabels[project.acquisitionSource];

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

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Service" value={project.serviceCategory} />
        <InfoCard label="Source" value={sourceLabel} />
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
          status="Coming in the next task"
        />
        <ActionCard
          title="Publication controls"
          description="After verification, publish only the consented evidence fields as a public proof card."
          status="Locked until verified"
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
}: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-medium uppercase text-zinc-500">{status}</p>
      <h2 className="mt-2 text-lg font-semibold text-zinc-950">{title}</h2>
      <p className="mt-2 text-sm text-zinc-600 text-pretty">{description}</p>
    </div>
  );
}

function formatPeriod(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "Not provided";
  }

  return `${start ?? "Unknown"} → ${end ?? "Present"}`;
}
