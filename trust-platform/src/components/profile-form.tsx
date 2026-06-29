"use client";

import { useActionState } from "react";

import { saveProfile, type ProfileActionState } from "@/app/actions/profile";
import type { ProfileRecord } from "@/data/profiles";
import type { Locale } from "@/lib/i18n";

const initialState: ProfileActionState = {};

const profileFormCopy: Record<
  Locale,
  {
    displayName: string;
    profileUrl: string;
    profileUrlHelp: string;
    headline: string;
    headlineHelp: string;
    bio: string;
    country: string;
    countryHelp: string;
    timeZone: string;
    timeZoneHelp: string;
    serviceCategories: string;
    serviceCategoriesHelp: string;
    saving: string;
    save: string;
    savingStatus: string;
    editLater: string;
    messages: Record<string, string>;
  }
> = {
  en: {
    displayName: "Display name",
    profileUrl: "Profile URL",
    profileUrlHelp: "Lowercase letters, numbers, and hyphens.",
    headline: "Headline",
    headlineHelp: "A short positioning line, e.g. AI automation consultant.",
    bio: "Bio",
    country: "Country",
    countryHelp: "Two-letter code, e.g. JP or US.",
    timeZone: "Time zone",
    timeZoneHelp: "Example: Asia/Tokyo.",
    serviceCategories: "Service categories",
    serviceCategoriesHelp: "Comma-separated.",
    saving: "Saving...",
    save: "Save profile",
    savingStatus: "Saving your profile.",
    editLater: "You can edit this later.",
    messages: {},
  },
  ja: {
    displayName: "表示名",
    profileUrl: "プロフィールURL",
    profileUrlHelp: "英小文字・数字・ハイフンが使えます。",
    headline: "肩書き・見出し",
    headlineHelp: "例: AI業務自動化コンサルタント",
    bio: "自己紹介",
    country: "国",
    countryHelp: "2文字コード。例: JP または US",
    timeZone: "タイムゾーン",
    timeZoneHelp: "例: Asia/Tokyo",
    serviceCategories: "提供カテゴリ",
    serviceCategoriesHelp: "カンマ区切りで入力してください。",
    saving: "保存中...",
    save: "プロフィールを保存",
    savingStatus: "プロフィールを保存しています。",
    editLater: "後から編集できます。",
    messages: {
      "Fix the highlighted fields.": "赤字の項目を修正してください。",
      "Unable to save profile.": "プロフィールを保存できませんでした。",
    },
  },
};

function fieldError(
  state: ProfileActionState,
  name: string,
): string | undefined {
  return state.errors?.[name]?.[0];
}

export function ProfileForm({
  profile,
  locale,
}: {
  profile: ProfileRecord | null;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState(saveProfile, initialState);
  const copy = profileFormCopy[locale];
  const message =
    state.message ? copy.messages[state.message] ?? state.message : undefined;

  const categories = profile?.serviceCategories.join(", ") ?? "";

  return (
    <form action={action} className="space-y-6" aria-busy={pending}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="displayName"
          label={copy.displayName}
          name="displayName"
          autoComplete="name"
          defaultValue={profile?.displayName}
          error={fieldError(state, "displayName")}
          required
        />
        <Field
          id="slug"
          label={copy.profileUrl}
          name="slug"
          defaultValue={profile?.slug}
          error={fieldError(state, "slug")}
          help={copy.profileUrlHelp}
          required
        />
      </div>

      <Field
        id="headline"
        label={copy.headline}
        name="headline"
        defaultValue={profile?.headline}
        error={fieldError(state, "headline")}
        help={copy.headlineHelp}
      />

      <div>
        <label
          htmlFor="bio"
          className="block text-sm font-medium text-zinc-900"
        >
          {copy.bio}
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
          label={copy.country}
          name="countryCode"
          defaultValue={profile?.countryCode ?? undefined}
          error={fieldError(state, "countryCode")}
          help={copy.countryHelp}
        />
        <Field
          id="timeZone"
          label={copy.timeZone}
          name="timeZone"
          defaultValue={profile?.timeZone ?? undefined}
          error={fieldError(state, "timeZone")}
          help={copy.timeZoneHelp}
        />
        <Field
          id="serviceCategories"
          label={copy.serviceCategories}
          name="serviceCategories"
          defaultValue={categories}
          error={fieldError(state, "serviceCategories")}
          help={copy.serviceCategoriesHelp}
        />
      </div>

      {message ? (
        <p className="text-sm text-red-700" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? copy.saving : copy.save}
        </button>
        <p className="text-sm text-zinc-500" aria-live="polite">
          {pending ? copy.savingStatus : copy.editLater}
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
