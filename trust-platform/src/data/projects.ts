import "server-only";

import { z } from "zod";

import {
  type ProjectDraftInput,
  projectDraftContentHash,
} from "@/domain/project-draft";
import { projectStatuses, type ProjectStatus } from "@/domain/project-status";
import { createClient } from "@/lib/supabase/server";

const createdProjectSchema = z.object({
  id: z.uuid(),
  status: z.enum(projectStatuses),
});

export type CreatedProject = z.infer<typeof createdProjectSchema>;

export type ProjectListItem = {
  id: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  title: string;
  companyName: string;
  serviceCategory: string;
};

export type ProjectDetail = ProjectListItem & {
  acquisitionSource: ProjectDraftInput["acquisitionSource"];
  sourcePlatformLabel: string | null;
  companyDomain: string;
  companyWebsite: string | null;
  projectStart: string | null;
  projectEnd: string | null;
  roleDescription: string;
  summary: string;
  outcomeStatement: string;
  outcomeMetricValue: number | null;
  outcomeMetricUnit: string | null;
  contentHash: string;
};

type ProjectRow = {
  id: string;
  status: ProjectStatus;
  current_revision_id: string | null;
  created_at: string;
  updated_at: string;
};

type RevisionRow = {
  id: string;
  title: string;
  company_name: string;
  company_website: string | null;
  company_domain: string;
  acquisition_source: ProjectDraftInput["acquisitionSource"];
  source_platform_label: string | null;
  service_category: string;
  project_start: string | null;
  project_end: string | null;
  role_description: string;
  summary: string;
  outcome_statement: string;
  outcome_metric_value: number | null;
  outcome_metric_unit: string | null;
  content_hash: string;
};

function toProjectListItem(
  project: ProjectRow,
  revision: RevisionRow | undefined,
): ProjectListItem {
  return {
    id: project.id,
    status: project.status,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    title: revision?.title ?? "Untitled project",
    companyName: revision?.company_name ?? "Unknown company",
    serviceCategory: revision?.service_category ?? "Uncategorized",
  };
}

function toProjectDetail(project: ProjectRow, revision: RevisionRow): ProjectDetail {
  return {
    ...toProjectListItem(project, revision),
    acquisitionSource: revision.acquisition_source,
    sourcePlatformLabel: revision.source_platform_label,
    companyDomain: revision.company_domain,
    companyWebsite: revision.company_website,
    projectStart: revision.project_start,
    projectEnd: revision.project_end,
    roleDescription: revision.role_description,
    summary: revision.summary,
    outcomeStatement: revision.outcome_statement,
    outcomeMetricValue: revision.outcome_metric_value,
    outcomeMetricUnit: revision.outcome_metric_unit,
    contentHash: revision.content_hash,
  };
}

export async function insertProjectWithRevision({
  input,
}: {
  userId: string;
  input: ProjectDraftInput;
}): Promise<CreatedProject> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_project_draft", {
    p_title: input.title,
    p_company_name: input.companyName,
    p_company_website: input.companyWebsite,
    p_company_domain: input.companyDomain,
    p_acquisition_source: input.acquisitionSource,
    p_source_platform_label: input.sourcePlatformLabel,
    p_service_category: input.serviceCategory,
    p_project_start: input.projectStart,
    p_project_end: input.projectEnd,
    p_role_description: input.roleDescription,
    p_summary: input.summary,
    p_outcome_statement: input.outcomeStatement,
    p_outcome_metric_value: input.outcomeMetricValue,
    p_outcome_metric_unit: input.outcomeMetricUnit,
    p_content_hash: projectDraftContentHash(input),
  });

  if (error) {
    throw new Error("Unable to create project draft.");
  }

  const [createdProject] = z.array(createdProjectSchema).parse(data);
  return createdProject;
}

export async function listProjectsForUser(
  userId: string,
): Promise<ProjectListItem[]> {
  const supabase = await createClient();
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id,status,current_revision_id,created_at,updated_at")
    .eq("owner_id", userId)
    .order("updated_at", { ascending: false });

  if (projectsError) {
    throw new Error("Unable to load projects.");
  }

  const revisionIds = (projects ?? [])
    .map((project) => project.current_revision_id)
    .filter((id): id is string => Boolean(id));

  if (revisionIds.length === 0) {
    return (projects ?? []).map((project) =>
      toProjectListItem(project as ProjectRow, undefined),
    );
  }

  const { data: revisions, error: revisionsError } = await supabase
    .from("project_revisions")
    .select("id,title,company_name,service_category")
    .in("id", revisionIds);

  if (revisionsError) {
    throw new Error("Unable to load project revisions.");
  }

  const revisionsById = new Map(
    (revisions ?? []).map((revision) => [
      revision.id,
      revision as RevisionRow,
    ]),
  );

  return (projects ?? []).map((project) =>
    toProjectListItem(
      project as ProjectRow,
      project.current_revision_id
        ? revisionsById.get(project.current_revision_id)
        : undefined,
    ),
  );
}

export async function getProjectForUser({
  projectId,
  userId,
}: {
  projectId: string;
  userId: string;
}): Promise<ProjectDetail | null> {
  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,status,current_revision_id,created_at,updated_at")
    .eq("owner_id", userId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    throw new Error("Unable to load project.");
  }

  if (!project?.current_revision_id) {
    return null;
  }

  const { data: revision, error: revisionError } = await supabase
    .from("project_revisions")
    .select(
      "id,title,company_name,company_website,company_domain,acquisition_source,source_platform_label,service_category,project_start,project_end,role_description,summary,outcome_statement,outcome_metric_value,outcome_metric_unit,content_hash",
    )
    .eq("id", project.current_revision_id)
    .maybeSingle();

  if (revisionError) {
    throw new Error("Unable to load project revision.");
  }

  return revision
    ? toProjectDetail(project as ProjectRow, revision as RevisionRow)
    : null;
}
