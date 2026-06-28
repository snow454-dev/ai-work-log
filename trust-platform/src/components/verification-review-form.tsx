"use client";

import { useActionState } from "react";

import {
  submitReviewerVerification,
  type ReviewerVerificationState,
} from "@/app/actions/reviewer-verification";
import type { ReviewContext } from "@/data/verifications";

const initialState: ReviewerVerificationState = {};

export function VerificationReviewForm({
  context,
}: {
  context: ReviewContext;
}) {
  const action = submitReviewerVerification.bind(null, context.requestId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-8" aria-busy={pending}>
      {context.outcomeMetricValue !== null ? (
        <input type="hidden" name="hasOutcomeMetric" value="on" />
      ) : null}

      <section className="space-y-4">
        <SectionTitle
          title="Confirm the facts"
          description="Only approve facts you can stand behind on behalf of your company."
        />
        <Checkbox name="projectExisted" label="This project existed" defaultChecked />
        <Checkbox
          name="sourceAccurate"
          label="The acquisition source is accurate"
          defaultChecked
        />
        <Checkbox name="roleAccurate" label="The role is accurate" defaultChecked />
        <Checkbox
          name="outcomeAccurate"
          label="The outcome statement is accurate"
          defaultChecked
        />
        {context.outcomeMetricValue !== null ? (
          <Checkbox
            name="metricAccurate"
            label="The outcome metric is accurate"
            defaultChecked
          />
        ) : null}
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Reference preference"
          description="This is separate from whether the facts are accurate."
        />
        <Select
          name="rehireResponse"
          label="Would you work with this professional again?"
          options={[
            ["yes", "Yes"],
            ["maybe", "Maybe"],
            ["no", "No"],
          ]}
        />
        <Select
          name="sharingPreference"
          label="How may this verification be used?"
          options={[
            ["share_public_profile", "They may show approved fields publicly"],
            ["open_to_reference_request", "Open to future reference requests"],
            ["not_now", "Not now"],
          ]}
          required
        />
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Optional attribution"
          description="Leave these blank if you do not want your name or title shown."
        />
        <Field name="reviewerName" label="Your name" />
        <Field name="reviewerJobTitle" label="Your job title" />
        <div>
          <label
            htmlFor="reviewerComment"
            className="block text-sm font-medium text-zinc-900"
          >
            Comment
          </label>
          <textarea
            id="reviewerComment"
            name="reviewerComment"
            rows={4}
            className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle
          title="Public visibility"
          description="Choose exactly which approved fields can appear on the professional's public proof card."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Checkbox name="showCompanyName" label="Company name" />
          <Checkbox name="showAcquisitionSource" label="Acquisition source" />
          <Checkbox name="showReviewerName" label="Reviewer name" />
          <Checkbox name="showReviewerJobTitle" label="Reviewer job title" />
          <Checkbox name="showProjectPeriod" label="Project period" />
          <Checkbox name="showOutcomeStatement" label="Outcome statement" />
          {context.outcomeMetricValue !== null ? (
            <Checkbox name="showOutcomeMetric" label="Outcome metric" />
          ) : null}
          <Checkbox name="showReviewerComment" label="Reviewer comment" />
          <Checkbox name="showRehireResponse" label="Rehire response" />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <Checkbox
          name="consentConfirmed"
          label="I confirm I am authorized to submit this verification and consent to the selected public fields."
        />
      </section>

      {state.message ? (
        <p className="text-sm text-red-700" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Submitting..." : "Submit verification"}
      </button>
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

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex gap-3 text-sm text-zinc-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-950"
      />
      <span>{label}</span>
    </label>
  );
}

function Field({ name, label }: { name: string; label: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <input
        id={name}
        name={name}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      />
    </div>
  );
}

function Select({
  name,
  label,
  options,
  required,
}: {
  name: string;
  label: string;
  options: readonly (readonly [string, string])[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-900">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={required ? options[0]?.[0] : ""}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
      >
        {!required ? <option value="">Prefer not to say</option> : null}
        {options.map(([value, optionLabel]) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
