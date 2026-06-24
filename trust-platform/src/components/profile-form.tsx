"use client";

import { useActionState } from "react";

import { saveProfile, type ProfileActionState } from "@/app/actions/profile";
import type { ProfileRecord } from "@/data/profiles";

const initialState: ProfileActionState = {};

function fieldError(
  state: ProfileActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function ProfileForm({ profile }: { profile: ProfileRecord | null }) {
  const [state, action, pending] = useActionState(saveProfile, initialState);

  const categories = profile?.serviceCategories.join(", ") ?? "";

  return (
    <form action={action} className="space-y-6" aria-busy={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="displayName"
          label="Display name"
          name="displayName"
          autoComplete="name"
          defaultValue={profile?.displayName}
          error={fieldError(state, "displayName")}
          required
        />
        <Field
          id="slug"
          label="Profile URL"
          name="slug"
          defaultValue={profile?.slug}
          error={fieldError(state, "slug")}
          help="Lowercase letters, numbers, and hyphens."
          required
        />
      </div>

      <Field
        id="headline"
        label="Headline"
        name="headline"
        defaultValue={profile?.headline}
        error={fieldError(state, "headline")}
        help="A short positioning line, e.g. AI automation consultant."
      />

      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-zinc-900"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile?.bio}
          aria-invalid={Boolean(fieldError(state, "bio"))}
          aria-describedby={fieldError(state, "bio") ? "bio-error" : undefined}
          className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
        />
        <FieldMessage id="bio-error" message={fieldError(state, "bio")} />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Field
          id="countryCode"
          label="Country"
          name="countryCode"
          defaultValue={profile?.countryCode ?? undefined}
          error={fieldError(state, "countryCode")}
          help="Two-letter code, e.g. JP or US."
        />
        <Field
          id="timeZone"
          label="Time zone"
          name="timeZone"
          defaultValue={profile?.timeZone ?? undefined}
          error={fieldError(state, "timeZone")}
          help="Example: Asia/Tokyo."
        />
        <Field
          id="serviceCategories"
          label="Service categories"
          name="serviceCategories"
          defaultValue={categories}
          error={fieldError(state, "serviceCategories")}
          help="Comma-separated."
        />
      </div>

      {state.message ? (
        <p className="text-sm text-red-700" aria-live="polite">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        <p className="text-sm text-zinc-500" aria-live="polite">
          {pending ? "Saving your profile." : "You can edit this later."}
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  name,
  defaultValue,
  error,
  help,
  required,
  autoComplete,
}: {
  id: string;
  label: string;
  name: string;
  defaultValue?: string;
  error?: string;
  help?: string;
  required?: boolean;
  autoComplete?: string;
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
        defaultValue={defaultValue}
        required={required}
        autoComplete={autoComplete}
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
