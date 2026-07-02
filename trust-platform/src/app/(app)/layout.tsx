import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { getCurrentUserId } from "@/data/auth";
import { localizedHref, type Locale } from "@/lib/i18n";
import { resolveServerLocale } from "@/lib/i18n-server";

const appLayoutCopy: Record<
  Locale,
  {
    nav: string;
    addProject: string;
    signOut: string;
  }
> = {
  en: {
    nav: "Main navigation",
    addProject: "Add project",
    signOut: "Sign out",
  },
  ja: {
    nav: "メインナビゲーション",
    addProject: "案件を追加",
    signOut: "ログアウト",
  },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await resolveServerLocale();
  const copy = appLayoutCopy[locale];

  try {
    await getCurrentUserId();
  } catch {
    redirect(localizedHref("/sign-in", locale));
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link
            href={localizedHref("/dashboard", locale)}
            className="text-sm font-semibold"
          >
            JISSEKI
          </Link>
          <nav aria-label={copy.nav} className="flex items-center gap-4">
            <Link
              href={localizedHref("/projects/new", locale)}
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              {copy.addProject}
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
              >
                {copy.signOut}
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
