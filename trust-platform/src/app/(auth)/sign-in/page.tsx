"use client";

import { use, useActionState } from "react";

import { signIn, type SignInState } from "@/app/actions/auth";

const initialState: SignInState = {};

type SearchParams = Promise<{
  error?: string | string[];
}>;

export default function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = use(searchParams);
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const hasEmailError = Boolean(state.error);
  const hasInvalidLink = query.error === "invalid";
  const emailDescriptionIds = [
    "email-helper",
    hasEmailError ? "email-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-stone-50 px-6 py-16 text-stone-950">
      <section
        className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm"
        aria-labelledby="sign-in-title"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium text-stone-500">
            Verified reputation platform
          </p>
          <h1
            id="sign-in-title"
            className="text-3xl font-semibold tracking-tight text-stone-950"
          >
            Sign in to build trusted proof of work.
          </h1>
          <p className="text-sm leading-6 text-stone-600">
            Get a secure link to record completed projects, request company
            verification, and keep referral-ready trust signals in one place.
          </p>
        </div>

        {hasInvalidLink ? (
          <p
            id="link-error"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            That sign-in link is invalid or expired. Request a fresh link below.
          </p>
        ) : null}

        {state.sent ? (
          <p
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            Check your inbox for a secure sign-in link. You can keep this tab
            open while you verify your email.
          </p>
        ) : null}

        <form
          action={formAction}
          className="mt-8 space-y-5"
          aria-busy={pending}
          noValidate
        >
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-stone-900"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              aria-describedby={emailDescriptionIds}
              aria-invalid={hasEmailError ? "true" : undefined}
              className="block w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-950 outline-none focus-visible:border-stone-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950"
              placeholder="you@example.com"
            />
            <p id="email-helper" className="text-sm leading-6 text-stone-600">
              We will email a magic link. No password is required.
            </p>
            {state.error ? (
              <p
                id="email-error"
                className="text-sm font-medium text-red-700"
                aria-live="polite"
              >
                {state.error}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-5 py-3 text-base font-medium text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {pending ? "Sending secure link…" : "Email me a secure link"}
          </button>
        </form>
      </section>
    </main>
  );
}
