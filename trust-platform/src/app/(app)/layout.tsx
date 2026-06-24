import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/actions/auth";
import { getCurrentUserId } from "@/data/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await getCurrentUserId();
  } catch {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/dashboard" className="text-sm font-semibold">
            Proofboard
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <Link
              href="/projects/new"
              className="text-sm font-medium text-zinc-700 hover:text-zinc-950"
            >
              Add project
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm font-medium text-zinc-500 hover:text-zinc-950"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
