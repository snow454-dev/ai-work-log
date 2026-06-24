"use client";

import { useActionState } from "react";

import { createProject, type ProjectActionState } from "@/app/actions/projects";

const initialState: ProjectActionState = {};

const acquisitionOptions = [
  ["upwork", "Upwork"],
  ["sankaku", "サンカク"],
  ["other_platform", "Other platform"],
  ["referral", "Referral"],
  ["direct", "Direct"],
  ["other", "Other"],
] as const;

function fieldError(
  state: ProjectActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function ProjectForm() {
  const [state, action, pending] = useActionState(createProject, initialState);

  return (
    <form action={action} className="space-y-8" aria-busy={pending}>
      <section className="space-y-5">
        <SectionTitle
          title="Project basics"
          description="Describe the completed work as factual evidence, not as an ad."
        />
        <Field
          id="title"
          name="title"
          label="Project title"
          error={fieldError(state, "title")}
          required
          placeholder="Reporting automation for weekly sales ops"
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="serviceCategory"
            name="serviceCategory"
            label="Service category"
            error={fieldError(state, "serviceCategory")}
            required
            placeholder="AI automation"
          />
          <Field
            id="companyName"
            name="companyName"
            label="Client company"
            error={fieldError(state, "companyName")}
            required
            placeholder="Acme Inc."
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="companyDomain"
            name="companyDomain"
            label="Company domain"
            error={fieldError(state, "companyDomain")}
            required
            placeholder="acme.com"
            help="The reviewer email must use this domain."
          />
          <Field
            id="reviewerEmail"
            name="reviewerEmail"
            label="Reviewer email"
            type="email"
            error={fieldError(state, "reviewerEmail")}
            required
            placeholder="manager@acme.com"
            help="Used later to request company verification."
          />
        </div>
        <Field
          id="companyWebsite"
          name="companyWebsite"
          label="Company website"
          error={fieldError(state, "companyWebsite")}
          placeholder="https://acme.com"
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          title="How the work started"
          description="This records the acquisition source only. It does not claim that an external marketplace verified the work."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="acquisitionSource"
              className="block text-sm font-medium text-zinc-900"
            >
              Acquisition source <span className="text-red-600">*</span>
            </label>
            <select
              id="acquisitionSource"
              name="acquisitionSource"
              defaultValue="upwork"
              aria-invalid={Boolean(fieldError(state, "acquisitionSource"))}
              aria-describedby={
                fieldError(state, "acquisitionSource")
                  ? "acquisitionSource-error"
                  : "acquisitionSource-help"
              }
              className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            >
              {acquisitionOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <FieldMessage
              id="acquisitionSource-error"
              message={fieldError(state, "acquisitionSource")}
            />
            {!fieldError(state, "acquisitionSource") ? (
              <p id="acquisitionSource-help" className="mt-1 text-xs text-zinc-500">
                Pick where the engagement began.
              </p>
            ) : null}
          </div>
          <Field
            id="sourcePlatformLabel"
            name="sourcePlatformLabel"
            label="Other platform name"
            error={fieldError(state, "sourcePlatformLabel")}
            placeholder="Contra, Malt, Worksome..."
            help="Required only when source is Other platform."
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          title="Work performed"
          description="Keep this specific enough that the reviewer can confidently approve or correct it."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="projectStart"
            name="projectStart"
            label="Project start"
            type="date"
            error={fieldError(state, "projectStart")}
          />
          <Field
            id="projectEnd"
            name="projectEnd"
            label="Project end"
            type="date"
            error={fieldError(state, "projectEnd")}
          />
        </div>
        <TextArea
          id="roleDescription"
          name="roleDescription"
          label="Your role"
          error={fieldError(state, "roleDescription")}
          required
          placeholder="I designed and implemented..."
        />
        <TextArea
          id="summary"
          name="summary"
          label="Project summary"
          error={fieldError(state, "summary")}
          required
          placeholder="The client needed..."
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          title="Outcome"
          description="Use a concrete business outcome. Metrics are optional but powerful."
        />
        <TextArea
          id="outcomeStatement"
          name="outcomeStatement"
          label="Outcome statement"
          error={fieldError(state, "outcomeStatement")}
          required
          placeholder="Saved 18 hours per week by..."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="outcomeMetricValue"
            name="outcomeMetricValue"
            label="Metric value"
            type="number"
            error={fieldError(state, "outcomeMetricValue")}
            placeholder="18"
          />
          <Field
            id="outcomeMetricUnit"
            name="outcomeMetricUnit"
            label="Metric unit"
            error={fieldError(state, "outcomeMetricUnit")}
            placeholder="hours/week"
          />
        </div>
      </section>

      {state.message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? "Creating..." : "Create project draft"}
        </button>
        <p className="text-sm text-zinc-500" aria-live="polite">
          {pending
            ? "Creating an immutable first revision."
            : "You will review it before sending a verification request."}
        </p>
      </div>
    </form>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-950 text-balance">
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 text-pretty">{description}</p>
    </div>
  );
}

function Field({
  id,
  name,
  label,
  error,
  help,
  required,
  type = "text",
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  help?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const messageId = error ? `${id}-error` : help ? `${id}-help` : undefined;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={messageId}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
      <FieldMessage id={`${id}-error`} message={error} />
      {!error && help ? (
        <p id={`${id}-help`} className="mt-1 text-xs text-zinc-500">
          {help}
        </p>
      ) : null}
    </div>
  );
}

function TextArea({
  id,
  name,
  label,
  error,
  required,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <textarea
        id={id}
        name={name}
        rows={4}
        required={required}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
      <FieldMessage id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1 text-sm text-red-700">
      {message}
    </p>
  );
}
