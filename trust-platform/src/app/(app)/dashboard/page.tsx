import Link from "next/link";

import {
  acceptReferenceRequest,
  declineReferenceRequest,
} from "@/app/actions/reference-request-decisions";
import { getCurrentUserId } from "@/data/auth";
import { listProjectsForUser, type ProjectListItem } from "@/data/projects";
import { getProfileForUser } from "@/data/profiles";
import {
  listReferenceRequestsForOwner,
  type ReferenceRequestListItem,
} from "@/data/reference-requests";
import type { ProjectStatus } from "@/domain/project-status";

const statusLabels: Record<ProjectStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  verified: "Verified",
  published: "Published",
  withdrawn: "Withdrawn",
  expired: "Expired",
  declined: "Declined",
  disputed: "Disputed",
};

export default async function DashboardPage() {
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
            <p className="text-sm font-medium text-zinc-500">MVP workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950 text-balance">
              Build verified proof from completed client work
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-600 text-pretty">
              Add a completed project, request company verification, then share
              only the evidence the company approved.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {profile?.isPublic ? (
              <Link
                href={`/p/${profile.slug}`}
                className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 shadow-sm hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                View public profile
              </Link>
            ) : null}
            <Link
              href="/projects/new"
              className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
            >
              Add completed project
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Projects" value={projects.length} />
        <MetricCard label="Pending company review" value={pendingCount} />
        <MetricCard label="Verified proof" value={verifiedCount} />
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">
              Reference requests
            </h2>
            <p className="text-sm text-zinc-500">
              Requests from prospects who found a reference path on your public
              proof.
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 tabular-nums">
            {referenceRequests.length}
          </span>
        </div>
        {referenceRequests.length === 0 ? (
          <div className="px-6 py-8">
            <p className="text-sm text-zinc-500 text-pretty">
              No reference requests yet. When a prospect submits one, it will
              appear here before any company reviewer is contacted.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200">
            {referenceRequests.map((request) => (
              <ReferenceRequestRow key={request.id} request={request} />
            ))}
          </ul>
        )}
      </section>

      {!profile ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-950">
            Complete your profile first
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-amber-900">
            Companies are more likely to approve a verification request when the
            professional identity is clear.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex rounded-full bg-amber-950 px-4 py-2 text-sm font-medium text-white"
          >
            Set up profile
          </Link>
        </section>
      ) : null}

      <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Projects</h2>
            <p className="text-sm text-zinc-500">
              One card per completed engagement.
            </p>
          </div>
        </div>
        {projects.length === 0 ? (
          <EmptyProjects />
        ) : (
          <ul className="divide-y divide-zinc-200">
            {projects.map((project) => (
              <ProjectRow key={project.id} project={project} />
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

function EmptyProjects() {
  return (
    <div className="px-6 py-12 text-center">
      <h3 className="text-lg font-semibold text-zinc-950">
        No projects yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 text-pretty">
        Start with one completed engagement. The first draft only records facts;
        verification and public sharing come after.
      </p>
      <Link
        href="/projects/new"
        className="mt-5 inline-flex rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white"
      >
        Add completed project
      </Link>
    </div>
  );
}

function ReferenceRequestRow({
  request,
}: {
  request: ReferenceRequestListItem;
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
            {request.status}
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
                  Accept
                </button>
              </form>
              <form action={declineReferenceRequest.bind(null, request.id)}>
                <button
                  type="submit"
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 sm:w-auto"
                >
                  Decline
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function ProjectRow({ project }: { project: ProjectListItem }) {
  return (
    <li>
      <Link
        href={`/projects/${project.id}`}
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
            {statusLabels[project.status]}
          </span>
        </div>
      </Link>
    </li>
  );
}
