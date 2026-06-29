"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  submitReferenceRequest,
  type ReferenceRequestActionState,
} from "@/app/actions/reference-requests";

const initialState: ReferenceRequestActionState = {};

function fieldError(
  state: ReferenceRequestActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function ReferenceRequestForm({
  slug,
  evidenceId,
}: {
  slug: string;
  evidenceId: string;
}) {
  const action = submitReferenceRequest.bind(null, slug, evidenceId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-6" aria-busy={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="requesterName"
          name="requesterName"
          label="Your name"
          autoComplete="name"
          error={fieldError(state, "requesterName")}
          required
        />
        <Field
          id="requesterEmail"
          name="requesterEmail"
          label="Work email"
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
          label="Company"
          autoComplete="organization"
          error={fieldError(state, "requesterCompany")}
          required
        />
        <Field
          id="requesterRole"
          name="requesterRole"
          label="Role"
          autoComplete="organization-title"
          error={fieldError(state, "requesterRole")}
        />
      </div>

      <TextArea
        id="opportunityContext"
        name="opportunityContext"
        label="Why are you requesting this reference?"
        help="Briefly describe the project, role, or buying decision this reference would support."
        error={fieldError(state, "opportunityContext")}
        required
      />

      <TextArea
        id="message"
        name="message"
        label="Optional message"
        help="Add anything the professional should know before deciding whether to route this request."
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
              I understand this request is shared with the professional first.
              Reviewer contact details are not exposed or contacted directly by
              this form.
            </label>
            <p id="consentConfirmed-help" className="mt-2 text-xs text-zinc-500">
              Proofboard stores this request so the professional can review the
              next step. Beta use is subject to the{" "}
              <Link href="/legal/privacy" className="underline">
                Privacy Notice
              </Link>{" "}
              and{" "}
              <Link href="/legal/terms" className="underline">
                Terms
              </Link>
              .
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
        {pending ? "Submitting..." : "Submit reference request"}
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
