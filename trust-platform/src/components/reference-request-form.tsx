"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  submitReferenceRequest,
  type ReferenceRequestActionState,
} from "@/app/actions/reference-requests";
import { localizedHref, type Locale } from "@/lib/i18n";

const initialState: ReferenceRequestActionState = {};

const referenceRequestFormCopy: Record<
  Locale,
  {
    name: string;
    email: string;
    company: string;
    role: string;
    reason: string;
    reasonHelp: string;
    message: string;
    messageHelp: string;
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
    name: "Your name",
    email: "Work email",
    company: "Company",
    role: "Role",
    reason: "Why are you requesting this reference?",
    reasonHelp:
      "Briefly describe the project, role, or buying decision this reference would support.",
    message: "Optional message",
    messageHelp:
      "Add anything the professional should know before deciding whether to route this request.",
    consent:
      "I understand this request is shared with the professional first. Reviewer contact details are not exposed or contacted directly by this form.",
    helpPrefix:
      "JISSEKI stores this request so the professional can review the next step. Beta use is subject to the",
    privacy: "Privacy Notice",
    terms: "Terms",
    helpSuffix: ".",
    submitting: "Submitting...",
    submit: "Submit reference request",
  },
  ja: {
    name: "お名前",
    email: "仕事用メール",
    company: "会社名",
    role: "役職",
    reason: "紹介を依頼する理由",
    reasonHelp:
      "この紹介が支援するプロジェクト、役割、または検討中の意思決定を簡潔に記入してください。",
    message: "任意メッセージ",
    messageHelp:
      "本人がこの依頼を紹介ルートに進めるべきか判断するために必要な補足があれば記入してください。",
    consent:
      "この依頼はまず本人に共有され、確認担当者の連絡先はこのフォームで公開・直接連絡されないことを理解しています。",
    helpPrefix:
      "JISSEKIは、本人が次のステップを確認できるようこの依頼を保存します。β利用には",
    privacy: "プライバシー通知",
    terms: "利用規約",
    helpSuffix: "が適用されます。",
    submitting: "送信中...",
    submit: "紹介依頼を送信",
  },
};

function fieldError(
  state: ReferenceRequestActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function ReferenceRequestForm({
  slug,
  evidenceId,
  locale = "en",
}: {
  slug: string;
  evidenceId: string;
  locale?: Locale;
}) {
  const action = submitReferenceRequest.bind(null, slug, evidenceId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const copy = referenceRequestFormCopy[locale];

  return (
    <form action={formAction} className="space-y-6" aria-busy={pending}>
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
          id="requesterEmail"
          name="requesterEmail"
          label={copy.email}
          type="email"
          autoComplete="email"
          error={fieldError(state, "requesterEmail")}
          required
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="requesterCompany"
          name="requesterCompany"
          label={copy.company}
          autoComplete="organization"
          error={fieldError(state, "requesterCompany")}
          required
        />
        <Field
          id="requesterRole"
          name="requesterRole"
          label={copy.role}
          autoComplete="organization-title"
          error={fieldError(state, "requesterRole")}
        />
      </div>

      <TextArea
        id="opportunityContext"
        name="opportunityContext"
        label={copy.reason}
        help={copy.reasonHelp}
        error={fieldError(state, "opportunityContext")}
        required
      />

      <TextArea
        id="message"
        name="message"
        label={copy.message}
        help={copy.messageHelp}
        error={fieldError(state, "message")}
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
            <label htmlFor="consentConfirmed">
              {copy.consent}
            </label>
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
        className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
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
  required,
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
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-900">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
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
  required,
}: {
  id: string;
  name: string;
  label: string;
  help: string;
  error?: string;
  required?: boolean;
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
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : `${id}-help`}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
      <p id={`${id}-help`} className="mt-1 text-xs text-zinc-500">
        {help}
      </p>
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
