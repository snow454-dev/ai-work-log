"use client";

import { useActionState } from "react";

import {
  manageAdminBetaAccessRequest,
  type AdminBetaAccessActionState,
} from "@/app/actions/admin-beta-access";
import type { AdminBetaAccessStatus } from "@/data/admin-beta-access";
import type { Locale } from "@/lib/i18n";

const initialState: AdminBetaAccessActionState = { ok: false };

const copyByLocale = {
  en: {
    review: "Mark reviewing",
    invite: "Invite",
    resend: "Resend invite",
    decline: "Decline",
    close: "Close",
    working: "Saving…",
    manualLabel: "Share this sign-in page manually:",
    messages: {
      reviewing: "Moved to reviewing.",
      invited: "Access granted and invitation email sent.",
      "invited-manual": "Access granted. Email is in manual mode.",
      "invited-email-failed":
        "Access was granted, but the invitation email failed. Share the sign-in page manually.",
      declined: "Request declined.",
      closed: "Request closed.",
      invalid: "This action is invalid. Reload and try again.",
      failed: "Unable to update this request. Try again.",
    },
  },
  ja: {
    review: "審査中にする",
    invite: "招待する",
    resend: "招待を再送",
    decline: "辞退",
    close: "対応完了",
    working: "保存中…",
    manualLabel: "このログインページを手動で共有してください：",
    messages: {
      reviewing: "審査中に変更しました。",
      invited: "アクセスを付与し、招待メールを送信しました。",
      "invited-manual":
        "アクセスを付与しました。メールは手動送信モードです。",
      "invited-email-failed":
        "アクセスは付与済みですが、招待メールの送信に失敗しました。ログインページを手動共有してください。",
      declined: "申請を辞退に変更しました。",
      closed: "対応完了に変更しました。",
      invalid: "操作が無効です。再読み込みしてやり直してください。",
      failed: "申請を更新できませんでした。もう一度お試しください。",
    },
  },
} as const;

export function AdminBetaAccessActions({
  requestId,
  status,
  locale,
}: {
  requestId: string;
  status: AdminBetaAccessStatus;
  locale: Locale;
}) {
  const copy = copyByLocale[locale];
  const [state, formAction, pending] = useActionState(
    manageAdminBetaAccessRequest,
    initialState,
  );
  const canReview = status !== "reviewing";
  const canDecline = status !== "declined" && status !== "closed";
  const canClose = status !== "closed";

  return (
    <div className="border-t border-stone-200 pt-4">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="locale" value={locale} />

        <button
          type="submit"
          name="operation"
          value="invite"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#d7ff45] px-4 text-sm font-semibold text-stone-950 outline-none transition hover:bg-[#c5ef35] focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? copy.working
            : status === "invited"
              ? copy.resend
              : copy.invite}
        </button>

        {canReview ? (
          <button
            type="submit"
            name="operation"
            value="review"
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-stone-300 bg-white px-4 text-sm font-medium text-stone-800 outline-none transition hover:border-stone-500 hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {copy.review}
          </button>
        ) : null}

        {canDecline ? (
          <button
            type="submit"
            name="operation"
            value="decline"
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-red-700 outline-none transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {copy.decline}
          </button>
        ) : null}

        {canClose ? (
          <button
            type="submit"
            name="operation"
            value="close"
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-stone-500 outline-none transition hover:bg-stone-100 hover:text-stone-950 focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
          >
            {copy.close}
          </button>
        ) : null}
      </form>

      {state.message ? (
        <div
          className={`mt-3 rounded-xl border px-3 py-2 text-sm leading-6 ${
            state.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : state.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : "border-red-200 bg-red-50 text-red-800"
          }`}
          aria-live="polite"
        >
          <p>{copy.messages[state.message]}</p>
          {state.manualSignInUrl ? (
            <label className="mt-2 block text-xs font-medium">
              {copy.manualLabel}
              <input
                readOnly
                value={state.manualSignInUrl}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-1 block w-full rounded-lg border border-current/20 bg-white px-2 py-1.5 text-xs text-stone-950"
              />
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
