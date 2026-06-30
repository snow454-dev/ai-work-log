"use client";

import Link from "next/link";
import { use, useActionState } from "react";

import { signIn, type SignInState } from "@/app/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizedHref, resolveLocale, type Locale } from "@/lib/i18n";

const initialState: SignInState = {};

type SearchParams = Promise<{
  error?: string | string[];
  lang?: string | string[];
}>;

const signInCopy: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    invalidLink: string;
    sent: string;
    emailLabel: string;
    emailHelp: string;
    accessHelp: string;
    accessCta: string;
    sending: string;
    submit: string;
  }
> = {
  en: {
    eyebrow: "Verified reputation platform",
    title: "Sign in to build trusted proof of work.",
    intro:
      "Get a secure link to record completed projects, request company verification, and keep referral-ready trust signals in one place.",
    invalidLink:
      "That sign-in link is invalid or expired. Request a fresh link below.",
    sent:
      "Check your inbox for a secure sign-in link. You can keep this tab open while you verify your email.",
    emailLabel: "Email address",
    emailHelp: "We will email a magic link. No password is required.",
    accessHelp: "Not invited yet?",
    accessCta: "Request private beta access",
    sending: "Sending secure link…",
    submit: "Email me a secure link",
  },
  ja: {
    eyebrow: "検証済み実績プラットフォーム",
    title: "信頼できる実績証明を作成する",
    intro:
      "完了案件を記録し、企業確認を依頼し、紹介に使える信頼シグナルを一か所で管理できます。",
    invalidLink:
      "このログインリンクは無効または期限切れです。下から新しいリンクを依頼してください。",
    sent:
      "安全なログインリンクをメールで送信しました。メール確認中もこのタブは開いたままで大丈夫です。",
    emailLabel: "メールアドレス",
    emailHelp: "パスワード不要のマジックリンクをメールで送ります。",
    accessHelp: "まだ招待されていませんか？",
    accessCta: "プライベートβアクセスを申請",
    sending: "安全なリンクを送信中…",
    submit: "安全なリンクをメールで受け取る",
  },
};

const signInErrorMessages: Record<Locale, Record<string, string>> = {
  en: {},
  ja: {
    "Enter a valid email address.": "有効なメールアドレスを入力してください。",
    "Unable to send the sign-in email.":
      "ログインメールを送信できませんでした。",
    "This private beta is invite-only. Ask the Proofboard team for access.":
      "このプライベートβは招待制です。Proofboardチームへアクセスを依頼してください。",
  },
};

function localizeSignInError(
  error: string | undefined,
  locale: Locale,
): string | undefined {
  if (!error) {
    return undefined;
  }

  return signInErrorMessages[locale][error] ?? error;
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = use(searchParams);
  const locale = resolveLocale(query);
  const copy = signInCopy[locale];
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const emailError = localizeSignInError(state.error, locale);
  const hasEmailError = Boolean(emailError);
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
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-stone-500">
              {copy.eyebrow}
            </p>
            <LanguageSwitcher locale={locale} path="/sign-in" />
          </div>
          <h1
            id="sign-in-title"
            className="text-3xl font-semibold tracking-tight text-stone-950"
          >
            {copy.title}
          </h1>
          <p className="text-sm leading-6 text-stone-600">
            {copy.intro}
          </p>
        </div>

        {hasInvalidLink ? (
          <p
            id="link-error"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {copy.invalidLink}
          </p>
        ) : null}

        {state.sent ? (
          <p
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {copy.sent}
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
              {copy.emailLabel}
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
              {copy.emailHelp}
            </p>
            {emailError ? (
              <p
                id="email-error"
                className="text-sm font-medium text-red-700"
                aria-live="polite"
              >
                {emailError}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-stone-950 px-5 py-3 text-base font-medium text-white outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {pending ? copy.sending : copy.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-600">
          {copy.accessHelp}{" "}
          <Link
            href={localizedHref("/beta-access", locale)}
            className="font-medium text-stone-950 underline underline-offset-4"
          >
            {copy.accessCta}
          </Link>
        </p>
      </section>
    </main>
  );
}
