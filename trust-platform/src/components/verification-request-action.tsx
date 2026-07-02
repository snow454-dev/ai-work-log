"use client";

import { useActionState } from "react";

import {
  sendVerificationRequestWithState,
  type VerificationActionState,
} from "@/app/actions/verification-requests";
import type { Locale } from "@/lib/i18n";

const initialState: VerificationActionState = {
  ok: false,
  message: "",
};

const copyByLocale: Record<
  Locale,
  {
    submit: string;
    submitting: string;
    manualTitle: string;
    manualDescription: string;
    reviewer: string;
    expires: string;
    copyHelp: string;
    messages: Record<string, string>;
  }
> = {
  en: {
    submit: "Send verification request",
    submitting: "Creating request...",
    manualTitle: "Manual beta link ready",
    manualDescription:
      "Copy this link and send it to the company reviewer through a trusted company channel. The link is shown only now.",
    reviewer: "Reviewer",
    expires: "Expires",
    copyHelp: "Select and copy the full link.",
    messages: {},
  },
  ja: {
    submit: "確認依頼を作成",
    submitting: "確認依頼を作成中...",
    manualTitle: "β用の手動リンクを作成しました",
    manualDescription:
      "このリンクをコピーし、信頼できる企業連絡経路で確認担当者へ送ってください。このリンクは今回の作成直後だけ表示されます。",
    reviewer: "確認担当者",
    expires: "有効期限",
    copyHelp: "リンク全体を選択してコピーしてください。",
    messages: {
      "Manual verification link created. Copy it and send it to the company reviewer through a trusted channel.":
        "手動確認リンクを作成しました。信頼できる連絡経路で企業確認担当者へ送ってください。",
      "Verification request sent to the company reviewer.":
        "企業確認担当者へ確認依頼を送信しました。",
      "The request was saved, but the email could not be sent. Please try again.":
        "確認依頼は保存されましたが、メール送信に失敗しました。もう一度試してください。",
    },
  },
};

function localizeMessage(message: string, locale: Locale) {
  return copyByLocale[locale].messages[message] ?? message;
}

export function VerificationRequestAction({
  projectId,
  locale,
}: {
  projectId: string;
  locale: Locale;
}) {
  const copy = copyByLocale[locale];
  const action = sendVerificationRequestWithState.bind(null, projectId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const message = state.message ? localizeMessage(state.message, locale) : "";

  return (
    <div className="mt-4 space-y-4">
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? copy.submitting : copy.submit}
        </button>
      </form>

      {message ? (
        <p
          className={`text-sm ${state.ok ? "text-emerald-800" : "text-red-700"}`}
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}

      {state.manualInvitationUrl ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h3 className="text-sm font-semibold text-emerald-950">
            {copy.manualTitle}
          </h3>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            {copy.manualDescription}
          </p>
          {state.reviewerEmail ? (
            <p className="mt-3 text-xs text-emerald-900">
              {copy.reviewer}: {state.reviewerEmail}
            </p>
          ) : null}
          {state.expiresAt ? (
            <p className="mt-1 text-xs text-emerald-900">
              {copy.expires}: {new Date(state.expiresAt).toISOString()}
            </p>
          ) : null}
          <label
            htmlFor="manualInvitationUrl"
            className="mt-3 block text-xs font-medium text-emerald-950"
          >
            {copy.copyHelp}
          </label>
          <input
            id="manualInvitationUrl"
            readOnly
            value={state.manualInvitationUrl}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-1 block w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs text-zinc-950"
          />
        </section>
      ) : null}
    </div>
  );
}
