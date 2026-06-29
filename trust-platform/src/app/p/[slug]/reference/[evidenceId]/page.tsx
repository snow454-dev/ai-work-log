import Link from "next/link";
import { notFound } from "next/navigation";

import { ReferenceRequestForm } from "@/components/reference-request-form";
import { LightLegalFooter } from "@/components/legal-footer";
import { getPublicProfileBySlug } from "@/data/public-profile";

export default async function ReferenceRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; evidenceId: string }>;
  searchParams: Promise<{ submitted?: string | string[] }>;
}) {
  const [{ slug, evidenceId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const evidence = profile.evidence.find((item) => item.id === evidenceId);

  if (!evidence?.publicReferenceAvailable) {
    notFound();
  }

  const submitted = Array.isArray(query.submitted)
    ? query.submitted[0]
    : query.submitted;

  return (
    <main className="min-h-dvh bg-zinc-50 text-zinc-950">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <header className="flex items-center justify-between gap-4">
          <Link href={`/p/${profile.slug}`} className="text-sm font-semibold">
            ← {profile.displayName}
          </Link>
          <p className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
            Structured reference request
          </p>
        </header>

        <section className="mt-10 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
          <p className="text-sm font-medium text-zinc-500">
            Company-approved proof
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-zinc-950 text-balance">
            Request a reference path for {evidence.publicTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 text-pretty">
            This request goes to the professional first. Proofboard does not
            reveal or contact the company reviewer directly from this form.
          </p>
        </section>

        {submitted === "1" ? (
          <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
            <h2 className="text-lg font-semibold text-emerald-950">
              Request received
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-900 text-pretty">
              The professional can now review your request and decide whether to
              route it into a reference conversation. Reviewer contact details
              remain private.
            </p>
            <Link
              href={`/p/${profile.slug}`}
              className="mt-4 inline-flex rounded-full bg-emerald-950 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-emerald-950 focus:ring-offset-2"
            >
              Back to public profile
            </Link>
          </section>
        ) : (
          <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">
                What happens next
              </h2>
              <ol className="mt-4 space-y-4 text-sm text-zinc-600">
                <Step
                  value="1"
                  text="Your request is stored for the professional to review."
                />
                <Step
                  value="2"
                  text="The professional decides whether this is a relevant reference path."
                />
                <Step
                  value="3"
                  text="The company reviewer is not contacted unless a later consented workflow is accepted."
                />
              </ol>
            </aside>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-zinc-950">
                Your request
              </h2>
              <p className="mt-2 text-sm text-zinc-500 text-pretty">
                Use a work email and give enough context for the professional to
                judge whether the reference request is appropriate.
              </p>
              <div className="mt-6">
                <ReferenceRequestForm
                  slug={profile.slug}
                  evidenceId={evidence.id}
                />
              </div>
            </section>
          </section>
        )}

        <LightLegalFooter />
      </div>
    </main>
  );
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
