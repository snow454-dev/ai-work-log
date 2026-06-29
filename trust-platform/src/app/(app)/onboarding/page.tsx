import Link from "next/link";

import { ProfileForm } from "@/components/profile-form";
import { getCurrentUserId } from "@/data/auth";
import { getProfileForUser } from "@/data/profiles";
import { localizedHref, type Locale, type LocaleSearchParams } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";

const onboardingCopy: Record<
  Locale,
  {
    back: string;
    title: string;
    intro: string;
  }
> = {
  en: {
    back: "← Back to dashboard",
    title: "Set up your public proof profile",
    intro:
      "This is the identity companies will verify against. Keep it clear and professional; you can refine the public copy later.",
  },
  ja: {
    back: "← ダッシュボードへ戻る",
    title: "公開実績プロフィールを設定する",
    intro:
      "企業が確認する本人情報です。明確でプロフェッショナルな内容にしておくと、公開文面は後から調整できます。",
  },
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = await resolveServerLocale(await searchParams);
  const copy = onboardingCopy[locale];
  const userId = await getCurrentUserId();
  const profile = await getProfileForUser(userId);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <Link
          href={localizedHref("/dashboard", locale)}
          className="text-sm font-medium text-zinc-500"
        >
          {copy.back}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-950 text-balance">
          {copy.title}
        </h1>
        <p className="mt-3 text-zinc-600 text-pretty">
          {copy.intro}
        </p>
      </div>
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ProfileForm profile={profile} locale={locale} />
      </div>
    </div>
  );
}
