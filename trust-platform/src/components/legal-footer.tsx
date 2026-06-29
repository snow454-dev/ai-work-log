import Link from "next/link";

export function LightLegalFooter() {
  return (
    <footer className="mt-10 border-t border-zinc-200 py-6 text-sm text-zinc-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Proofboard. Private beta.</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-zinc-950">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-zinc-950">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function DarkLegalFooter() {
  return (
    <footer className="border-t border-white/10 py-6 text-sm text-zinc-400">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Proofboard. Private beta.</p>
        <nav aria-label="Legal" className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-white">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
