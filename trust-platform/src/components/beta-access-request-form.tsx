"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  submitBetaAccessRequest,
  type BetaAccessRequestActionState,
} from "@/app/actions/beta-access-requests";
import {
  betaAccessIntents,
  type BetaAccessIntent,
} from "@/domain/beta-access-request";
import { localizedHref, type Locale } from "@/lib/i18n";

const initialState: BetaAccessRequestActionState = {};

const betaAccessFormCopy: Record<
  Locale,
  {
    intent: string;
    developer: string;
    company: string;
    name: string;
    email: string;
    companyName: string;
    role: string;
    useCase: string;
    useCaseHelp: string;
    consent: string;
    helpPrefix: string;
    privacy: string;
    terms: string;
    helpSuffix: string;
    submitting: string;
    submit: string;
  }
> = {
  en: {
    intent: "Beta path",
    developer: "AI developer",
    company: "Company buyer",
    name: "Your name",
    email: "Work email",
    companyName: "Company or studio",
    role: "Role",
    useCase: "What do you want to validate first?",
    useCaseHelp:
      "Example: one completed AI automation project to verify, or a vendor search for a trusted AI engineer.",
    consent:
      "I understand Proofboard will store this request so the beta team can review access and follow up.",
    helpPrefix: "Beta use is subject to the",
    privacy: "Privacy Notice",
    terms: "Terms",
    helpSuffix: ".",
    submitting: "Submitting...",
    submit: "Request private beta access",
  },
  ja: {
    intent: "βの利用目的",
    developer: "AI開発者として使う",
    company: "企業側として使う",
    name: "お名前",
    email: "仕事用メール",
    companyName: "会社名・屋号",
    role: "役職",
    useCase: "最初に検証したいこと",
    useCaseHelp:
      "例: 完了済みAI自動化案件を1件検証したい、または信頼できるAIエンジニア選定に使いたい。",
    consent:
      "Proofboardがβアクセス審査と連絡のためにこの申請を保存することを理解しています。",
    helpPrefix: "β利用には",
    privacy: "プライバシー通知",
    terms: "利用規約",
    helpSuffix: "が適用されます。",
    submitting: "送信中...",
    submit: "プライベートβアクセスを申請",
  },
};

function fieldError(
  state: BetaAccessRequestActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function BetaAccessRequestForm({
  locale = "en",
  initialIntent = "developer",
}: {
  locale?: Locale;
  initialIntent?: BetaAccessIntent;
}) {
  const action = submitBetaAccessRequest.bind(null, locale);
  const [state, formAction, pending] = useActionState(action, initialState);
  const copy = betaAccessFormCopy[locale];

  return (
    <form action={formAction} className="space-y-6" aria-busy={pending}>
      <input type="hidden" name="sourcePath" value="/beta-access" />

      <div className="space-y-2">
        <label htmlFor="intent" className="block text-sm font-medium text-zinc-900">
          {copy.intent}
        </label>
        <select
          id="intent"
          name="intent"
          defaultValue={initialIntent}
          aria-invalid={Boolean(fieldError(state, "intent"))}
          className="block w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none focus-visible:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
        >
          {betaAccessIntents.map((intent) => (
            <option key={intent} value={intent}>
              {intent === "developer" ? copy.developer : copy.company}
            </option>
          ))}
        </select>
        <FieldMessage id="intent-error" message={fieldError(state, "intent")} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="requesterName"
          name="requesterName"
          label={copy.name}
          autoComplete="name"
          error={fieldError(state, "requesterName")}
          required
        />
        <Field
          id="workEmail"
          name="workEmail"
          label={copy.email}
          type="email"
          autoComplete="email"
          error={fieldError(state, "workEmail")}
          required
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="companyName"
          name="companyName"
          label={copy.companyName}
          autoComplete="organization"
          error={fieldError(state, "companyName")}
        />
        <Field
          id="role"
          name="role"
          label={copy.role}
          autoComplete="organization-title"
          error={fieldError(state, "role")}
        />
      </div>

      <TextArea
        id="useCase"
        name="useCase"
        label={copy.useCase}
        help={copy.useCaseHelp}
        error={fieldError(state, "useCase")}
        required
      />

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex gap-3">
          <input
            id="consentConfirmed"
            type="checkbox"
            name="consentConfirmed"
            aria-invalid={Boolean(fieldError(state, "consentConfirmed"))}
            aria-describedby={
              fieldError(state, "consentConfirmed")
                ? "consentConfirmed-error"
                : "consentConfirmed-help"
            }
            className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-950"
          />
          <div className="text-sm text-zinc-700">
            <label htmlFor="consentConfirmed">{copy.consent}</label>
            <p id="consentConfirmed-help" className="mt-2 text-xs text-zinc-500">
              {copy.helpPrefix}{" "}
              <Link
                href={localizedHref("/legal/privacy", locale)}
                className="underline"
              >
                {copy.privacy}
              </Link>{" "}
              {locale === "ja" ? "および" : "and"}{" "}
              <Link
                href={localizedHref("/legal/terms", locale)}
                className="underline"
              >
                {copy.terms}
              </Link>
              {copy.helpSuffix}
            </p>
          </div>
        </div>
        <FieldMessage
          id="consentConfirmed-error"
          message={fieldError(state, "consentConfirmed")}
        />
      </div>

      {state.message ? (
        <p className="text-sm text-red-700" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  autoComplete,
  error,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="block w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none focus-visible:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
      />
      <FieldMessage id={`${id}-error`} message={error} />
    </div>
  );
}

function TextArea({
  id,
  name,
  label,
  help,
  error,
  required = false,
}: {
  id: string;
  name: string;
  label: string;
  help: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={5}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        className="block w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-950 outline-none focus-visible:border-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
      />
      <p id={`${id}-help`} className="text-sm leading-6 text-zinc-600">
        {help}
      </p>
      <FieldMessage id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldMessage({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-sm font-medium text-red-700" aria-live="polite">
      {message}
    </p>
  );
}
