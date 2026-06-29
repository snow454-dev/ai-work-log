"use client";

import { useActionState } from "react";

import { createProject, type ProjectActionState } from "@/app/actions/projects";
import type { Locale } from "@/lib/i18n";

const initialState: ProjectActionState = {};

const acquisitionOptions: Record<
  Locale,
  readonly (readonly [string, string])[]
> = {
  en: [
    ["upwork", "Upwork"],
    ["sankaku", "サンカク"],
    ["other_platform", "Other platform"],
    ["referral", "Referral"],
    ["direct", "Direct"],
    ["other", "Other"],
  ],
  ja: [
    ["upwork", "Upwork"],
    ["sankaku", "サンカク"],
    ["other_platform", "その他のプラットフォーム"],
    ["referral", "紹介"],
    ["direct", "直接契約"],
    ["other", "その他"],
  ],
};

const projectFormCopy: Record<
  Locale,
  {
    basicsTitle: string;
    basicsDescription: string;
    projectTitle: string;
    projectTitlePlaceholder: string;
    serviceCategory: string;
    serviceCategoryPlaceholder: string;
    companyName: string;
    companyNamePlaceholder: string;
    companyDomain: string;
    companyDomainHelp: string;
    reviewerEmail: string;
    reviewerEmailHelp: string;
    companyWebsite: string;
    sourceTitle: string;
    sourceDescription: string;
    acquisitionSource: string;
    acquisitionHelp: string;
    sourcePlatformLabel: string;
    sourcePlatformPlaceholder: string;
    sourcePlatformHelp: string;
    workTitle: string;
    workDescription: string;
    projectStart: string;
    projectEnd: string;
    roleDescription: string;
    roleDescriptionPlaceholder: string;
    summary: string;
    summaryPlaceholder: string;
    outcomeTitle: string;
    outcomeDescription: string;
    outcomeStatement: string;
    outcomeStatementPlaceholder: string;
    metricValue: string;
    metricUnit: string;
    creating: string;
    create: string;
    creatingStatus: string;
    reviewStatus: string;
    messages: Record<string, string>;
  }
> = {
  en: {
    basicsTitle: "Project basics",
    basicsDescription:
      "Describe the completed work as factual evidence, not as an ad.",
    projectTitle: "Project title",
    projectTitlePlaceholder: "Reporting automation for weekly sales ops",
    serviceCategory: "Service category",
    serviceCategoryPlaceholder: "AI automation",
    companyName: "Client company",
    companyNamePlaceholder: "Acme Inc.",
    companyDomain: "Company domain",
    companyDomainHelp: "The reviewer email must use this domain.",
    reviewerEmail: "Reviewer email",
    reviewerEmailHelp: "Used later to request company verification.",
    companyWebsite: "Company website",
    sourceTitle: "How the work started",
    sourceDescription:
      "This records the acquisition source only. It does not claim that an external marketplace verified the work.",
    acquisitionSource: "Acquisition source",
    acquisitionHelp: "Pick where the engagement began.",
    sourcePlatformLabel: "Other platform name",
    sourcePlatformPlaceholder: "Contra, Malt, Worksome...",
    sourcePlatformHelp: "Required only when source is Other platform.",
    workTitle: "Work performed",
    workDescription:
      "Keep this specific enough that the reviewer can confidently approve or correct it.",
    projectStart: "Project start",
    projectEnd: "Project end",
    roleDescription: "Your role",
    roleDescriptionPlaceholder: "I designed and implemented...",
    summary: "Project summary",
    summaryPlaceholder: "The client needed...",
    outcomeTitle: "Outcome",
    outcomeDescription:
      "Use a concrete business outcome. Metrics are optional but powerful.",
    outcomeStatement: "Outcome statement",
    outcomeStatementPlaceholder: "Saved 18 hours per week by...",
    metricValue: "Metric value",
    metricUnit: "Metric unit",
    creating: "Creating...",
    create: "Create project draft",
    creatingStatus: "Creating an immutable first revision.",
    reviewStatus: "You will review it before sending a verification request.",
    messages: {},
  },
  ja: {
    basicsTitle: "案件の基本情報",
    basicsDescription:
      "広告文ではなく、事実として確認できる完了済みの仕事を記録します。",
    projectTitle: "案件タイトル",
    projectTitlePlaceholder: "週次営業レポートの自動化",
    serviceCategory: "提供カテゴリ",
    serviceCategoryPlaceholder: "AI業務自動化",
    companyName: "依頼企業",
    companyNamePlaceholder: "Acme株式会社",
    companyDomain: "企業ドメイン",
    companyDomainHelp:
      "確認担当者のメールアドレスはこのドメインである必要があります。",
    reviewerEmail: "確認担当者のメール",
    reviewerEmailHelp: "後で企業確認リンクを送るために使います。",
    companyWebsite: "企業サイト",
    sourceTitle: "仕事の開始経路",
    sourceDescription:
      "受託の獲得経路だけを記録します。外部マーケットプレイスが実績を検証したという意味ではありません。",
    acquisitionSource: "獲得経路",
    acquisitionHelp: "この案件が始まった経路を選んでください。",
    sourcePlatformLabel: "その他プラットフォーム名",
    sourcePlatformPlaceholder: "Contra, Malt, Worksome...",
    sourcePlatformHelp:
      "獲得経路が「その他のプラットフォーム」の場合のみ必要です。",
    workTitle: "実施した仕事",
    workDescription:
      "確認担当者が安心して承認または修正できる程度に、具体的に記録します。",
    projectStart: "開始日",
    projectEnd: "終了日",
    roleDescription: "あなたの役割",
    roleDescriptionPlaceholder: "設計と実装を担当し...",
    summary: "案件概要",
    summaryPlaceholder: "クライアントは...",
    outcomeTitle: "成果",
    outcomeDescription:
      "具体的な事業成果を記録します。数値指標は任意ですが、強い証拠になります。",
    outcomeStatement: "成果の説明",
    outcomeStatementPlaceholder: "週18時間を削減...",
    metricValue: "指標の数値",
    metricUnit: "指標の単位",
    creating: "作成中...",
    create: "案件下書きを作成",
    creatingStatus: "改ざんできない初回リビジョンを作成しています。",
    reviewStatus: "確認依頼を送る前に内容を見直せます。",
    messages: {
      "Fix the highlighted fields.": "赤字の項目を修正してください。",
      "Unable to create this project draft.":
        "案件下書きを作成できませんでした。",
    },
  },
};

function fieldError(
  state: ProjectActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function ProjectForm({ locale }: { locale: Locale }) {
  const [state, action, pending] = useActionState(createProject, initialState);
  const copy = projectFormCopy[locale];
  const message =
    state.message ? copy.messages[state.message] ?? state.message : undefined;

  return (
    <form action={action} className="space-y-8" aria-busy={pending}>
      <section className="space-y-5">
        <SectionTitle
          title={copy.basicsTitle}
          description={copy.basicsDescription}
        />
        <Field
          id="title"
          name="title"
          label={copy.projectTitle}
          error={fieldError(state, "title")}
          required
          placeholder={copy.projectTitlePlaceholder}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="serviceCategory"
            name="serviceCategory"
            label={copy.serviceCategory}
            error={fieldError(state, "serviceCategory")}
            required
            placeholder={copy.serviceCategoryPlaceholder}
          />
          <Field
            id="companyName"
            name="companyName"
            label={copy.companyName}
            error={fieldError(state, "companyName")}
            required
            placeholder={copy.companyNamePlaceholder}
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="companyDomain"
            name="companyDomain"
            label={copy.companyDomain}
            error={fieldError(state, "companyDomain")}
            required
            placeholder="acme.com"
            help={copy.companyDomainHelp}
          />
          <Field
            id="reviewerEmail"
            name="reviewerEmail"
            label={copy.reviewerEmail}
            type="email"
            error={fieldError(state, "reviewerEmail")}
            required
            placeholder="manager@acme.com"
            help={copy.reviewerEmailHelp}
          />
        </div>
        <Field
          id="companyWebsite"
          name="companyWebsite"
          label={copy.companyWebsite}
          error={fieldError(state, "companyWebsite")}
          placeholder="https://acme.com"
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          title={copy.sourceTitle}
          description={copy.sourceDescription}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="acquisitionSource"
              className="block text-sm font-medium text-zinc-900"
            >
              {copy.acquisitionSource} <span className="text-red-600">*</span>
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
              {acquisitionOptions[locale].map(([value, label]) => (
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
                {copy.acquisitionHelp}
              </p>
            ) : null}
          </div>
          <Field
            id="sourcePlatformLabel"
            name="sourcePlatformLabel"
            label={copy.sourcePlatformLabel}
            error={fieldError(state, "sourcePlatformLabel")}
            placeholder={copy.sourcePlatformPlaceholder}
            help={copy.sourcePlatformHelp}
          />
        </div>
      </section>

      <section className="space-y-5">
        <SectionTitle
          title={copy.workTitle}
          description={copy.workDescription}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="projectStart"
            name="projectStart"
            label={copy.projectStart}
            type="date"
            error={fieldError(state, "projectStart")}
          />
          <Field
            id="projectEnd"
            name="projectEnd"
            label={copy.projectEnd}
            type="date"
            error={fieldError(state, "projectEnd")}
          />
        </div>
        <TextArea
          id="roleDescription"
          name="roleDescription"
          label={copy.roleDescription}
          error={fieldError(state, "roleDescription")}
          required
          placeholder={copy.roleDescriptionPlaceholder}
        />
        <TextArea
          id="summary"
          name="summary"
          label={copy.summary}
          error={fieldError(state, "summary")}
          required
          placeholder={copy.summaryPlaceholder}
        />
      </section>

      <section className="space-y-5">
        <SectionTitle
          title={copy.outcomeTitle}
          description={copy.outcomeDescription}
        />
        <TextArea
          id="outcomeStatement"
          name="outcomeStatement"
          label={copy.outcomeStatement}
          error={fieldError(state, "outcomeStatement")}
          required
          placeholder={copy.outcomeStatementPlaceholder}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            id="outcomeMetricValue"
            name="outcomeMetricValue"
            label={copy.metricValue}
            type="number"
            error={fieldError(state, "outcomeMetricValue")}
            placeholder="18"
          />
          <Field
            id="outcomeMetricUnit"
            name="outcomeMetricUnit"
            label={copy.metricUnit}
            error={fieldError(state, "outcomeMetricUnit")}
            placeholder="hours/week"
          />
        </div>
      </section>

      {message ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? copy.creating : copy.create}
        </button>
        <p className="text-sm text-zinc-500" aria-live="polite">
          {pending ? copy.creatingStatus : copy.reviewStatus}
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
