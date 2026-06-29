import Link from "next/link";

import { DarkLegalFooter } from "@/components/legal-footer";

export default function Home() {
  return (
    <main className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <p className="text-sm font-semibold">Proofboard</p>
          <Link
            href="/sign-in"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Sign in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-sm font-medium text-zinc-300">
              Verified proof for independent professionals
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-tight text-balance md:text-6xl">
              Turn completed client work into company-approved proof.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 text-pretty">
              Record work from Upwork, サンカク, referrals, direct contracts, or
              other platforms. The company verifies what is true and controls
              what can be shared publicly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-in"
                className="inline-flex justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Start with one project
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Open dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="rounded-2xl bg-white p-5 text-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase text-zinc-500">
                    Company verified
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Reporting automation
                  </h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Approved
                </span>
              </div>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-zinc-500">Client</dt>
                  <dd className="font-medium">Shared with permission</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Origin</dt>
                  <dd className="font-medium">Upwork engagement</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Outcome</dt>
                  <dd className="font-medium">Saved 18 hours per week</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <DarkLegalFooter />
      </div>
    </main>
  );
}
