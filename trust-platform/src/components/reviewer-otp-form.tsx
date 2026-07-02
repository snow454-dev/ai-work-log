"use client";

import { useActionState } from "react";

import {
  continueManualReviewerSession,
  requestReviewerOtp,
  type ReviewerAuthState,
  verifyReviewerOtpAction,
} from "@/app/actions/reviewer-auth";
import type { ReviewerInvitation } from "@/data/reviewer-auth";
import type { Locale } from "@/lib/i18n";

const initialState: ReviewerAuthState = {};

const reviewerOtpCopy: Record<
  Locale,
  {
    sendingCode: string;
    sendCode: string;
    manualTitle: string;
    manualDescription: string;
    manualContinue: string;
    codeLabel: string;
    codeHelp: string;
    verifying: string;
    continue: string;
    messages: Record<string, string>;
  }
> = {
  en: {
    sendingCode: "Sending code...",
    sendCode: "Send one-time code",
    manualTitle: "Private beta manual review",
    manualDescription:
      "This beta is using manual link delivery. Continue only if this link was sent to you through a trusted company channel.",
    manualContinue: "Continue to review",
    codeLabel: "Six-digit code",
    codeHelp: "The code expires after ten minutes.",
    verifying: "Verifying...",
    continue: "Continue to review",
    messages: {},
  },
  ja: {
    sendingCode: "コードを送信中...",
    sendCode: "ワンタイムコードを送信",
    manualTitle: "プライベートβの手動確認",
    manualDescription:
      "このβ環境ではリンクを手動で共有しています。信頼できる企業連絡経路でこのリンクを受け取った場合のみ続行してください。",
    manualContinue: "確認画面へ進む",
    codeLabel: "6桁のコード",
    codeHelp: "コードの有効期限は10分です。",
    verifying: "確認中...",
    continue: "確認画面へ進む",
    messages: {
      "If the invitation is valid, a code has been sent.":
        "招待が有効な場合、コードを送信しました。",
      "Enter the six-digit code.": "6桁のコードを入力してください。",
      "That code is invalid or expired. Request a new code.":
        "コードが無効または期限切れです。新しいコードを依頼してください。",
      "Manual review mode is not enabled.":
        "手動確認モードは有効ではありません。",
      "This verification link is invalid or expired.":
        "この確認リンクは無効または期限切れです。",
    },
  },
};

function localizeMessage(message: string | undefined, locale: Locale) {
  if (!message) {
    return undefined;
  }

  return reviewerOtpCopy[locale].messages[message] ?? message;
}

export function ReviewerOtpForm({
  invitation,
  token,
  locale,
  manualMode = false,
}: {
  invitation: ReviewerInvitation;
  token: string;
  locale: Locale;
  manualMode?: boolean;
}) {
  const copy = reviewerOtpCopy[locale];
  const requestOtp = requestReviewerOtp.bind(null, invitation.id, token);
  const verifyOtp = verifyReviewerOtpAction.bind(null, invitation.id, token);
  const continueManual = continueManualReviewerSession.bind(
    null,
    invitation.id,
    token,
  );
  const [requestState, requestAction, requestPending] = useActionState(
    requestOtp,
    initialState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtp,
    initialState,
  );
  const [manualState, manualAction, manualPending] = useActionState(
    continueManual,
    initialState,
  );
  const otpError = localizeMessage(verifyState.errors?.otp?.[0], locale);
  const requestMessage = localizeMessage(requestState.message, locale);
  const verifyMessage = localizeMessage(verifyState.message, locale);
  const manualMessage = localizeMessage(manualState.message, locale);

  if (manualMode) {
    return (
      <form
        action={manualAction}
        className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        aria-busy={manualPending}
      >
        <h2 className="text-base font-semibold text-amber-950">
          {copy.manualTitle}
        </h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          {copy.manualDescription}
        </p>
        {manualMessage ? (
          <p className="mt-3 text-sm text-red-700" aria-live="polite">
            {manualMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={manualPending}
          className="mt-4 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {manualPending ? copy.verifying : copy.manualContinue}
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <form action={requestAction}>
        <button
          type="submit"
          disabled={requestPending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {requestPending ? copy.sendingCode : copy.sendCode}
        </button>
        {requestMessage ? (
          <p className="mt-3 text-sm text-zinc-600" aria-live="polite">
            {requestMessage}
          </p>
        ) : null}
      </form>

      <form action={verifyAction} className="space-y-4" aria-busy={verifyPending}>
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-zinc-900">
            {copy.codeLabel}
          </label>
          <input
            id="otp"
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            aria-invalid={Boolean(otpError)}
            aria-describedby={otpError ? "otp-error" : "otp-help"}
            className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
          {otpError ? (
            <p id="otp-error" className="mt-1 text-sm text-red-700">
              {otpError}
            </p>
          ) : (
            <p id="otp-help" className="mt-1 text-xs text-zinc-500">
              {copy.codeHelp}
            </p>
          )}
        </div>

        {verifyMessage ? (
          <p className="text-sm text-red-700" aria-live="polite">
            {verifyMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={verifyPending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {verifyPending ? copy.verifying : copy.continue}
        </button>
      </form>
    </div>
  );
}
