import Link from "next/link";

import { LightLegalFooter } from "@/components/legal-footer";

export default function DemoPage() {
  return (
    <main className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-zinc-950">
            Proofboard
          </Link>
          <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            UI demo
          </p>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="text-sm font-medium text-zinc-500">
                Company-approved proof for independent work
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance md:text-5xl">
                Aiko Tanaka
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-700 text-pretty">
                AI automation consultant helping operations teams turn manual
                reporting into reliable internal workflows.
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-600 text-pretty">
                This is a static preview of the public proof and reference
                request UI. It does not submit data.
              </p>
            </div>

            <aside className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <h2 className="text-sm font-semibold text-zinc-950">
                Trust boundary
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
                Only company-approved fields are visible. Reviewer contact
                details stay private.
              </p>
              <dl className="mt-5 space-y-3 text-sm">
                <DemoMeta label="Verified proof" value="1" />
                <DemoMeta label="Reference paths" value="1" />
                <DemoMeta label="Country" value="JP" />
                <DemoMeta label="Time zone" value="Asia/Tokyo" />
              </dl>
            </aside>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2">
            <li className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
              AI automation
            </li>
            <li className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
              Operations
            </li>
          </ul>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Company-domain verified
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                Reference path available
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                AI automation
              </span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-zinc-950 text-balance">
              Reporting automation for weekly revenue operations
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Published Jun 28, 2026
            </p>

            <dl className="mt-6 grid gap-4 md:grid-cols-2">
              <DemoField label="Client company" value="Shared with consent" />
              <DemoField label="Acquisition source" value="Upwork" />
              <DemoField label="Project period" value="2026-02-01 → 2026-04-15" />
              <DemoField label="Outcome metric" value="18 hours/week saved" />
            </dl>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="text-sm font-medium text-zinc-500">
                Verified outcome
              </h3>
              <p className="mt-2 text-zinc-800 text-pretty">
                Automated weekly reporting and reduced manual spreadsheet work
                across the operations team.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <h3 className="text-sm font-semibold text-zinc-950">
                Structured reference path
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
                The company reviewer allowed future reference requests to be
                routed through Proofboard. Contact details stay private unless
                a future request is explicitly accepted.
              </p>
              <a
                href="#reference-form"
                className="mt-4 inline-flex rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2"
              >
                Request reference path
              </a>
            </div>
          </article>

          <section
            id="reference-form"
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">
              Structured reference request
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-950 text-balance">
              Ask for a consented reference path
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600 text-pretty">
              This form sends the request to the professional first. It does not
              reveal or contact the company reviewer directly.
            </p>

            <form className="mt-6 space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <DemoInput label="Your name" value="Mina Patel" />
                <DemoInput label="Work email" value="mina@example.com" />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <DemoInput label="Company" value="Future Works" />
                <DemoInput label="Role" value="Head of Operations" />
              </div>
              <DemoTextArea
                label="Why are you requesting this reference?"
                value="We are evaluating a similar reporting automation project and want to understand what the verified work looked like."
              />
              <DemoTextArea
                label="Optional message"
                value="If relevant, we would appreciate a short structured reference conversation."
              />
              <label className="flex gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked
                  readOnly
                  className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-950"
                />
                <span>
                  I understand this request is shared with the professional
                  first. Reviewer contact details are not exposed. Beta use is
                  subject to the{" "}
                  <Link href="/legal/privacy" className="underline">
                    Privacy Notice
                  </Link>{" "}
                  and{" "}
                  <Link href="/legal/terms" className="underline">
                    Terms
                  </Link>
                  .
                </span>
              </label>
              <button
                type="button"
                className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white shadow-sm"
              >
                Submit reference request
              </button>
            </form>
          </section>
        </section>

        <LightLegalFooter />
      </div>
    </main>
  );
}

function DemoMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-950 tabular-nums">{value}</dd>
    </div>
  );
}

function DemoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm text-zinc-500">{label}</dt>
      <dd className="mt-1 font-medium text-zinc-950 text-pretty">{value}</dd>
    </div>
  );
}

function DemoInput({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-zinc-900">
      {label}
      <input
        value={value}
        readOnly
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none"
      />
    </label>
  );
}

function DemoTextArea({ label, value }: { label: string; value: string }) {
  return (
    <label className="block text-sm font-medium text-zinc-900">
      {label}
      <textarea
        value={value}
        readOnly
        rows={4}
        className="mt-2 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-950 shadow-sm outline-none"
      />
    </label>
  );
}
