import { z } from "zod";

import { acquisitionSources } from "./public-evidence";
import { revisionContentHash } from "./revisions";

const consumerEmailDomains = new Set([
  "gmail.com",
  "outlook.com",
  "hotmail.com",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

const requiredText = (field: string, maxLength: number) =>
  z
    .string({ error: `${field} is required.` })
    .trim()
    .min(1, `${field} is required.`)
    .max(maxLength, `${field} must be ${maxLength} characters or fewer.`);

const optionalText = (maxLength: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  }, z.string().max(maxLength).nullable());

const optionalDate = z.preprocess((value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").nullable());

const optionalMetricValue = z.preprocess((value) => {
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length === 0 ? null : Number(normalized);
}, z.number({ error: "Metric value must be a number." }).finite().nonnegative().nullable());

export function normalizeDomain(input: string): string {
  const withoutProtocol = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "");
  const host = new URL(`https://${withoutProtocol}`).hostname.replace(
    /^www\./,
    "",
  );

  if (!host.includes(".")) {
    throw new Error("company domain must be a valid domain");
  }

  if (consumerEmailDomains.has(host)) {
    throw new Error("company domain must not be a consumer email domain");
  }

  return host;
}

const projectDraftSchema = z
  .object({
    title: requiredText("Project title", 160),
    companyName: requiredText("Company name", 200),
    companyWebsite: optionalText(300),
    companyDomain: z
      .string({ error: "Company domain is required." })
      .trim()
      .min(1, "Company domain is required.")
      .transform((value, ctx) => {
        try {
          return normalizeDomain(value);
        } catch (error) {
          ctx.addIssue({
            code: "custom",
            message:
              error instanceof Error
                ? error.message
                : "company domain must be valid",
          });
          return z.NEVER;
        }
      }),
    reviewerEmail: z
      .string({ error: "Reviewer email is required." })
      .trim()
      .toLowerCase()
      .pipe(z.email("Enter a valid reviewer email.")),
    acquisitionSource: z.enum(acquisitionSources, {
      error: "Select how this work was originally acquired.",
    }),
    sourcePlatformLabel: optionalText(120),
    serviceCategory: requiredText("Service category", 120),
    projectStart: optionalDate,
    projectEnd: optionalDate,
    roleDescription: requiredText("Role description", 1000),
    summary: requiredText("Project summary", 2000),
    outcomeStatement: requiredText("Outcome statement", 1000),
    outcomeMetricValue: optionalMetricValue,
    outcomeMetricUnit: optionalText(80),
  })
  .superRefine((value, ctx) => {
    const reviewerDomain = value.reviewerEmail.split("@").at(1);

    if (reviewerDomain !== value.companyDomain) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewerEmail"],
        message: "reviewer email must match the company domain",
      });
    }

    if (
      value.projectStart &&
      value.projectEnd &&
      value.projectEnd < value.projectStart
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["projectEnd"],
        message: "project end must be on or after the start date",
      });
    }

    if (
      value.acquisitionSource === "other_platform" &&
      !value.sourcePlatformLabel
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sourcePlatformLabel"],
        message: "source platform label is required for other platforms",
      });
    }

    if (
      value.acquisitionSource !== "other_platform" &&
      value.sourcePlatformLabel
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["sourcePlatformLabel"],
        message: "source platform label is only used for other platforms",
      });
    }

    if (value.outcomeMetricValue !== null && !value.outcomeMetricUnit) {
      ctx.addIssue({
        code: "custom",
        path: ["outcomeMetricUnit"],
        message: "metric unit is required when a metric value is provided",
      });
    }
  });

export type ProjectDraftInput = z.infer<typeof projectDraftSchema>;

export function parseProjectDraft(input: unknown): ProjectDraftInput {
  return projectDraftSchema.parse(input);
}

export function safeParseProjectDraft(input: unknown) {
  return projectDraftSchema.safeParse(input);
}

export function projectDraftContentHash(input: ProjectDraftInput): string {
  return revisionContentHash({
    title: input.title,
    companyName: input.companyName,
    companyWebsite: input.companyWebsite,
    companyDomain: input.companyDomain,
    acquisitionSource: input.acquisitionSource,
    sourcePlatformLabel: input.sourcePlatformLabel,
    serviceCategory: input.serviceCategory,
    projectStart: input.projectStart,
    projectEnd: input.projectEnd,
    roleDescription: input.roleDescription,
    summary: input.summary,
    outcomeStatement: input.outcomeStatement,
    outcomeMetricValue: input.outcomeMetricValue,
    outcomeMetricUnit: input.outcomeMetricUnit,
  });
}
