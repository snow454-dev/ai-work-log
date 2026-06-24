"use client";

import { useActionState } from "react";

import {
  requestReviewerOtp,
  type ReviewerAuthState,
  verifyReviewerOtpAction,
} from "@/app/actions/reviewer-auth";
import type { ReviewerInvitation } from "@/data/reviewer-auth";

const initialState: ReviewerAuthState = {};

export function ReviewerOtpForm({
  invitation,
  token,
}: {
  invitation: ReviewerInvitation;
  token: string;
}) {
  const requestOtp = requestReviewerOtp.bind(null, invitation.id, token);
  const verifyOtp = verifyReviewerOtpAction.bind(null, invitation.id, token);
  const [requestState, requestAction, requestPending] = useActionState(
    requestOtp,
    initialState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtp,
    initialState,
  );
  const otpError = verifyState.errors?.otp?.[0];

  return (
    <div className="space-y-6">
      <form action={requestAction}>
        <button
          type="submit"
          disabled={requestPending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {requestPending ? "Sending code..." : "Send one-time code"}
        </button>
        {requestState.message ? (
          <p className="mt-3 text-sm text-zinc-600" aria-live="polite">
            {requestState.message}
          </p>
        ) : null}
      </form>

      <form action={verifyAction} className="space-y-4" aria-busy={verifyPending}>
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-zinc-900">
            Six-digit code
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
              The code expires after ten minutes.
            </p>
          )}
        </div>

        {verifyState.message ? (
          <p className="text-sm text-red-700" aria-live="polite">
            {verifyState.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={verifyPending}
          className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {verifyPending ? "Verifying..." : "Continue to review"}
        </button>
      </form>
    </div>
  );
}
