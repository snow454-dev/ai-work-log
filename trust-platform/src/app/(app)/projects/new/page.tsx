import Link from "next/link";

import { ProjectForm } from "@/components/project-form";
import { localizedHref, type Locale, type LocaleSearchParams } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";

const newProjectCopy: Record<
  Locale,
  {
    back: string;
    title: string;
    intro: string;
  }
> = {
  en: {
    back: "← Back to dashboard",
    title: "Add a completed project",
    intro:
      "Create the factual draft that a company reviewer can safely approve. You will decide what becomes public after verification.",
  },
  ja: {
    back: "← ダッシュボードへ戻る",
    title: "完了案件を追加する",
    intro:
      "企業担当者が安全に承認できる事実ベースの下書きを作成します。確認後に何を公開するかはあなたが決められます。",
  },
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<LocaleSearchParams>;
}) {
  const locale = await resolveServerLocale(await searchParams);
  const copy = newProjectCopy[locale];

  return (
    <div className="mx-auto max-w-4xl">
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
        <p className="mt-3 max-w-2xl text-zinc-600 text-pretty">
          {copy.intro}
        </p>
      </div>
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <ProjectForm locale={locale} />
      </div>
    </div>
  );
}
