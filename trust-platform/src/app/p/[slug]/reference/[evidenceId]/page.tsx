import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { LightLegalFooter } from "@/components/legal-footer";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ReferenceRequestForm } from "@/components/reference-request-form";
import { getOptionalUserId } from "@/data/auth";
import { getPublicProfileBySlug } from "@/data/public-profile";
import {
  localizedHref,
  resolveLocale,
  type Locale,
  type LocaleSearchParams,
} from "@/lib/i18n";

const referencePageCopy: Record<
  Locale,
  {
    badge: string;
    proofEyebrow: string;
    titlePrefix: string;
    intro: string;
    receivedTitle: string;
    receivedBody: string;
    back: string;
    nextTitle: string;
    steps: string[];
    requestTitle: string;
    requestIntro: string;
  }
> = {
  en: {
    badge: "Structured reference request",
    proofEyebrow: "Company-approved proof",
    titlePrefix: "Request a reference path for",
    intro:
      "This request goes to the professional first. JISSEKI does not reveal or contact the company reviewer directly from this form.",
    receivedTitle: "Request received",
    receivedBody:
      "The professional can now review your request and decide whether to route it into a reference conversation. Reviewer contact details remain private.",
    back: "Back to public profile",
    nextTitle: "What happens next",
    steps: [
      "Your request is stored for the professional to review.",
      "The professional decides whether this is a relevant reference path.",
      "The company reviewer is not contacted unless a later consented workflow is accepted.",
    ],
    requestTitle: "Your request",
    requestIntro:
      "Use a work email and give enough context for the professional to judge whether the reference request is appropriate.",
  },
  ja: {
    badge: "構造化された紹介依頼",
    proofEyebrow: "企業承認済みの実績",
    titlePrefix: "紹介ルートを依頼",
    intro:
      "この依頼はまず本人に届きます。このフォームから企業の確認担当者を表示したり、直接連絡したりすることはありません。",
    receivedTitle: "依頼を受け付けました",
    receivedBody:
      "本人が依頼内容を確認し、紹介の会話へ進めるか判断できます。確認担当者の連絡先は非公開のままです。",
    back: "公開プロフィールへ戻る",
    nextTitle: "次に起こること",
    steps: [
      "依頼内容は、本人が確認できるよう保存されます。",
      "本人が、この依頼が適切な紹介ルートかどうか判断します。",
      "後続の同意済みフローが承認されない限り、企業の確認担当者には連絡されません。",
    ],
    requestTitle: "依頼内容",
    requestIntro:
      "仕事用メールを使い、本人が紹介依頼の妥当性を判断できるだけの背景を記入してください。",
  },
};

export default async function ReferenceRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; evidenceId: string }>;
  searchParams: Promise<LocaleSearchParams & { submitted?: string | string[] }>;
}) {
  const [{ slug, evidenceId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const locale = resolveLocale(query);
  const copy = referencePageCopy[locale];
  const [profile, userId] = await Promise.all([
    getPublicProfileBySlug(slug),
    getOptionalUserId(),
  ]);

  if (!profile) {
    notFound();
  }

  const evidence = profile.evidence.find((item) => item.id === evidenceId);

  if (!evidence?.publicReferenceAvailable) {
    notFound();
  }

  if (!userId) {
    redirect(
      signInHref(
        localizedHref(`/p/${profile.slug}/reference/${evidence.id}`, locale),
        locale,
      ),
    );
  }

  const submitted = Array.isArray(query.submitted)
    ? query.submitted[0]
    : query.submitted;

  return (
    <main lang={locale} className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={localizedHref(`/p/${profile.slug}`, locale)}
            className="text-sm font-semibold"
          >
            ← {profile.displayName}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher
              locale={locale}
              path={`/p/${profile.slug}/reference/${evidence.id}`}
            />
            <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              {copy.badge}
            </p>
          </div>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-zinc-500">
            {copy.proofEyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance">
            {copy.titlePrefix} {evidence.publicTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 text-pretty">
            {copy.intro}
          </p>
        </section>

        {submitted === "1" ? (
          <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-semibold text-emerald-950">
              {copy.receivedTitle}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-900 text-pretty">
              {copy.receivedBody}
            </p>
            <Link
              href={localizedHref(`/p/${profile.slug}`, locale)}
              className="mt-4 inline-flex rounded-full bg-emerald-950 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-950 focus:ring-offset-2"
            >
              {copy.back}
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">
                {copy.nextTitle}
              </h2>
              <ol className="mt-4 space-y-4 text-sm text-zinc-600">
                {copy.steps.map((step, index) => (
                  <Step key={step} value={String(index + 1)} text={step} />
                ))}
              </ol>
            </aside>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">
                {copy.requestTitle}
              </h2>
              <p className="mt-2 text-sm text-zinc-500 text-pretty">
                {copy.requestIntro}
              </p>
              <div className="mt-6">
                <ReferenceRequestForm
                  slug={profile.slug}
                  evidenceId={evidence.id}
                  locale={locale}
                />
              </div>
            </section>
          </section>
        )}

        <LightLegalFooter locale={locale} />
      </div>
    </main>
  );
}

function signInHref(next: string, locale: Locale): string {
  const params = new URLSearchParams({ next });
  if (locale !== "en") {
    params.set("lang", locale);
  }

  return `/sign-in?${params.toString()}`;
}

function Step({ value, text }: { value: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-700">
        {value}
      </span>
      <span className="leading-6 text-pretty">{text}</span>
    </li>
  );
}
